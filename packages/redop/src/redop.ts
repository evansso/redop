// ─────────────────────────────────────────────
//  redop — core class
// ─────────────────────────────────────────────

import { detectAdapter } from "./adapters/schema";
import { startHttpTransport } from "./transports/http";
import { startStdioTransport } from "./transports/stdio";
import type {
  AfterHook,
  BeforeHook,
  Context,
  ErrorHook,
  InferSchemaOutput,
  ListenOptions,
  MapResponseHook,
  PluginDefinition,
  PluginFactory,
  PluginMeta,
  RedopOptions,
  RequestMeta,
  ResolvedTool,
  SchemaAdapter,
  ServerInfoOptions,
  ToolDef,
  ToolHandlerEvent,
  ToolMiddleware,
  TransformHook,
} from "./types";

// ── Internal hook registry ────────────────────

interface HookRegistry {
  after: AfterHook[];
  before: BeforeHook[];
  error: ErrorHook[];
  mapResponse: MapResponseHook[];
  transform: TransformHook[];
}

type InputParser = (
  input: Record<string, unknown>
) => unknown | Promise<unknown>;

const DEFAULT_REQUEST_META: RequestMeta = {
  headers: {},
  transport: "stdio",
};

const DEFAULT_SERVER_INFO: Required<
  Pick<ServerInfoOptions, "name" | "version">
> &
  ServerInfoOptions = {
  name: "redop",
  version: "0.1.0",
};

// ── Redop class ───────────────────────────────

/**
 * Bun-native framework for building MCP servers with typed tools, hooks, and plugins.
 *
 * @example
 * const app = new Redop({
 *   name: "my-mcp-server",
 *   version: "0.1.0",
 * });
 */
export class Redop<C extends Context = Context> {
  private _hooks: HookRegistry = {
    after: [],
    before: [],
    error: [],
    mapResponse: [],
    transform: [],
  };

  private _tools = new Map<string, ResolvedTool>();
  private _middlewares: ToolMiddleware<unknown, unknown, C>[] = [];
  private _inputParsers = new Map<string, InputParser>();
  private _schemaAdapter?: SchemaAdapter;
  private _serverInfo: Required<ServerInfoOptions> = { ...DEFAULT_SERVER_INFO };
  private _prefix = "";

  /**
   * Create a new redop app instance.
   */
  constructor(options: RedopOptions = {}) {
    this._serverInfo = {
      description: options.description ?? DEFAULT_SERVER_INFO.description ?? "",
      icons: options.icons ?? DEFAULT_SERVER_INFO.icons ?? [],
      instructions:
        options.instructions ?? DEFAULT_SERVER_INFO.instructions ?? "",
      name: options.name ?? DEFAULT_SERVER_INFO.name,
      title: options.title ?? DEFAULT_SERVER_INFO.title ?? "",
      version: options.version ?? DEFAULT_SERVER_INFO.version,
      websiteUrl: options.websiteUrl ?? DEFAULT_SERVER_INFO.websiteUrl ?? "",
    };

    if (options?.schemaAdapter) {
      this._schemaAdapter = options.schemaAdapter;
    }
  }

  // ── Lifecycle hooks ───────────────────────

  /**
   * Register a hook that runs before middleware and the final tool handler.
   */
  onBeforeHandle(hook: BeforeHook<C>): this {
    this._hooks.before.push(hook as BeforeHook);
    return this;
  }

  /**
   * Register a hook that runs after a tool returns successfully.
   */
  onAfterHandle(hook: AfterHook<C>): this {
    this._hooks.after.push(hook as AfterHook);
    return this;
  }

  /**
   * Register a hook that runs when middleware or a tool handler throws.
   */
  onError(hook: ErrorHook<C>): this {
    this._hooks.error.push(hook as ErrorHook);
    return this;
  }

  /**
   * Register a hook that can mutate raw tool params before schema parsing.
   */
  onTransform(hook: TransformHook<C>): this {
    this._hooks.transform.push(hook as TransformHook);
    return this;
  }

  /**
   * Register a hook that maps successful tool results before transport output.
   */
  mapResponse(hook: MapResponseHook): this {
    this._hooks.mapResponse.push(hook);
    return this;
  }

  /**
   * Register request-aware middleware around the tool handler pipeline.
   */
  middleware<I = unknown>(mw: ToolMiddleware<I, unknown, C>): this {
    this._middlewares.push(mw as ToolMiddleware<unknown, unknown, C>);
    return this;
  }

  // ── Tool registration ─────────────────────

  /**
   * Register a tool with optional schema validation and typed handler input.
   * Tool-local `before` / `after` hooks are useful for per-tool analytics and post-processing.
   *
   * @example
   * app.tool("search", {
   *   input: z.object({ query: z.string() }),
   *   handler: ({ input }) => search(input.query),
   * });
   */
  tool<S, I = InferSchemaOutput<S>, O = unknown>(
    name: string,
    def: ToolDef<S, I, C, O>
  ): this {
    const fullName = this._prefix ? `${this._prefix}_${name}` : name;

    let inputSchema: Record<string, unknown> = {
      properties: {},
      type: "object",
    };

    if (def.input) {
      const adapter = this._schemaAdapter ?? detectAdapter(def.input);
      inputSchema = adapter.toJsonSchema(def.input);
      this._inputParsers.set(fullName, (input) =>
        adapter.parse(def.input as S, input)
      );
    }

    this._tools.set(fullName, {
      after: def.after as ResolvedTool["after"],
      annotations: def.annotations as Record<string, unknown>,
      before: def.before as ResolvedTool["before"],
      description: def.description,
      handler: def.handler as ResolvedTool["handler"],
      inputSchema,
      name: fullName,
    });

    return this;
  }

  /**
   * Register multiple tools under a shared prefix.
   */
  group(prefix: string, callback: (scoped: Redop<C>) => void): this {
    const scoped = new Redop<C>({
      name: this._serverInfo.name,
      schemaAdapter: this._schemaAdapter,
      version: this._serverInfo.version,
    });
    scoped._prefix = this._prefix ? `${this._prefix}_${prefix}` : prefix;
    scoped._hooks = this._hooks;
    scoped._middlewares = this._middlewares;
    callback(scoped);

    for (const [name, tool] of scoped._tools) {
      this._tools.set(name, tool);
    }
    for (const [name, parser] of scoped._inputParsers) {
      this._inputParsers.set(name, parser);
    }

    return this;
  }

  /**
   * Merge another Redop instance as a plugin into this app.
   */
  use(plugin: Redop): this {
    this._hooks.before.push(...plugin._hooks.before);
    this._hooks.after.push(...plugin._hooks.after);
    this._hooks.error.push(...plugin._hooks.error);
    this._hooks.transform.push(...plugin._hooks.transform);
    this._hooks.mapResponse.push(...plugin._hooks.mapResponse);
    this._middlewares.push(
      ...(plugin._middlewares as ToolMiddleware<unknown, unknown, C>[])
    );

    for (const [name, tool] of plugin._tools) {
      this._tools.set(name, tool);
    }
    for (const [name, parser] of plugin._inputParsers) {
      this._inputParsers.set(name, parser);
    }

    return this;
  }

  // ── Tool runner (internal) ────────────────

  private async _runTool(
    toolName: string,
    rawArgs: Record<string, unknown>,
    request: RequestMeta = DEFAULT_REQUEST_META
  ): Promise<unknown> {
    const tool = this._tools.get(toolName);
    if (!tool) {
      throw new Error(`Unknown tool: ${toolName}`);
    }

    const ctx = {
      headers: request.headers,
      rawParams: rawArgs,
      requestId: crypto.randomUUID(),
      sessionId: request.sessionId,
      tool: toolName,
      transport: request.transport,
    } as C;

    let params = { ...rawArgs };

    for (const hook of this._hooks.transform) {
      const out = await hook({ ctx, params, request, tool: toolName });
      if (out && typeof out === "object") {
        params = out as Record<string, unknown>;
      }
    }

    let input: unknown = params;
    const parser = this._inputParsers.get(toolName);
    if (parser) {
      try {
        input = await parser(params);
      } catch (error) {
        const validationError = new Error(
          `Validation failed for tool "${toolName}": ${
            error instanceof Error ? error.message : String(error)
          }`
        ) as Error & {
          cause?: unknown;
          issues?: unknown;
        };
        validationError.cause = error;
        if (typeof error === "object" && error !== null && "issues" in error) {
          validationError.issues = (error as { issues?: unknown }).issues;
        }
        throw validationError;
      }
    }

    const handlerEvent: ToolHandlerEvent<unknown, C> = {
      ctx,
      input,
      request,
      tool: toolName,
    };

    try {
      for (const hook of this._hooks.before) {
        await hook({
          ctx,
          input,
          params: input,
          request,
          tool: toolName,
        });
      }

      if (tool.before) {
        await tool.before(handlerEvent);
      }

      const dispatch = async (index: number): Promise<unknown> => {
        if (index >= this._middlewares.length) {
          return tool.handler(handlerEvent);
        }

        const mw = this._middlewares[index];
        if (!mw) {
          return tool.handler(handlerEvent);
        }
        return mw({
          ...handlerEvent,
          next: () => dispatch(index + 1),
        });
      };

      let result = await dispatch(0);

      if (tool.after) {
        await tool.after({
          ...handlerEvent,
          result,
        });
      }

      for (const hook of this._hooks.after) {
        await hook({
          ctx,
          input,
          params: input,
          request,
          result,
          tool: toolName,
        });
      }

      for (const hook of this._hooks.mapResponse) {
        result = await hook(result, toolName);
      }

      return result;
    } catch (error) {
      for (const hook of this._hooks.error) {
        await hook({
          tool: toolName,
          ctx,
          error: error,
          input,
          params: input,
          request,
        });
      }
      throw error;
    }
  }

  // ── Start server ──────────────────────────

  /**
   * Start serving the app over HTTP or stdio.
   */
  listen(opts: ListenOptions = {}) {
    const runner = (
      name: string,
      args: Record<string, unknown>,
      requestMeta: RequestMeta
    ) => this._runTool(name, args, requestMeta);

    const transport = opts.transport ?? (opts.port ? "http" : "stdio");

    if (transport === "stdio") {
      startStdioTransport(this._tools, runner, this._serverInfo);
      return this;
    }

    if (transport === "http") {
      startHttpTransport(this._tools, runner, opts, this._serverInfo);
      return this;
    }

    throw new Error(`[redop] Unknown transport: ${transport}`);
  }

  // ── Introspection ─────────────────────────

  /**
   * Registered tool names in their final exposed form.
   */
  get toolNames(): string[] {
    return [...this._tools.keys()];
  }

  /**
   * MCP server identity advertised during initialize.
   */
  get serverInfo() {
    return { ...this._serverInfo };
  }

  getTool(name: string): ResolvedTool | undefined {
    return this._tools.get(name);
  }
}

/**
 * Wrap a middleware function in a reusable Redop plugin.
 *
 * @example
 * app.use(
 *   middleware(async ({ request, next }) => {
 *     console.log(request.transport);
 *     return next();
 *   })
 * );
 */
export function middleware<I = unknown, C extends Context = Context>(
  fn: ToolMiddleware<I, unknown, C>
): Redop<C> {
  return new Redop<C>().middleware(fn);
}

/**
 * Create a reusable plugin factory with attached metadata.
 *
 * @example
 * const notesPlugin = definePlugin({
 *   name: "notes-plugin",
 *   version: "0.1.0",
 *   setup: ({ namespace = "notes" }) =>
 *     new Redop().group(namespace, (notes) => {
 *       notes.tool("list", { handler: () => [] });
 *     }),
 * });
 */
export function definePlugin<Options, C extends Context = Context>(
  definition: PluginDefinition<Options, C>
): PluginFactory<Options, C> {
  const factory = ((options: Options) =>
    definition.setup(options)) as PluginFactory<Options, C>;

  const meta: PluginMeta = {
    name: definition.name,
    version: definition.version,
    ...(definition.description ? { description: definition.description } : {}),
  };

  factory.meta = meta;
  return factory;
}
