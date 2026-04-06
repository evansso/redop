import type {
  Context,
  PromptContext,
  ResourceContext,
  ToolRequest,
} from "./context";
import type { InferSchemaOutput } from "./schema";
import type {
  ServerIcon,
  ToolAfterHook,
  ToolAfterResponseHook,
  ToolAnnotations,
  ToolBeforeHook,
  ToolHandler,
  ToolMiddleware,
} from "./tooling";

export interface ToolDef<
  S = unknown,
  I = InferSchemaOutput<S>,
  C extends Record<string, unknown> = {},
  O = unknown,
  OS = Record<string, unknown>,
> {
  after?: ToolAfterHook<I, O, C>;
  afterResponse?: ToolAfterResponseHook<I, O, C>;
  /** Behavioral hints forwarded to MCP clients. */
  annotations?: ToolAnnotations;
  before?: ToolBeforeHook<I, C>;
  description?: string;
  handler: ToolHandler<I, O, C>;
  icons?: ServerIcon[];
  /** Preferred schema field for tool arguments. */
  inputSchema?: S;
  /** @deprecated Use inputSchema instead. */
  input?: S;
  middleware?: ToolMiddleware<I, unknown, C>[];
  outputSchema?: OS;
  taskSupport?: "forbidden" | "optional" | "required";
  title?: string;
}

export interface ResolvedTool {
  after?: ToolAfterHook<unknown, unknown>;
  afterResponse?: ToolAfterResponseHook<unknown, unknown>;
  annotations?: ToolAnnotations;
  before?: ToolBeforeHook<unknown>;
  description?: string;
  handler: ToolHandler<unknown>;
  icons?: ServerIcon[];
  inputSchema: Record<string, unknown>;
  middleware?: ToolMiddleware<unknown, unknown>[];
  name: string;
  outputSchema?: Record<string, unknown>;
  taskSupport?: "forbidden" | "optional" | "required";
  title?: string;
}

/**
 * Content returned by a resource handler.
 * Use "text" for UTF-8 content; "blob" for base64-encoded binary.
 */
export type ResourceContents =
  | { type: "text"; text: string; mimeType?: string }
  | { type: "blob"; blob: string; mimeType?: string };

type ResourceParamShape<P extends Record<string, string> | undefined> =
  [P] extends [undefined] ? { params?: undefined } : { params: P };

type TemplateParamKeys<Uri extends string> =
  Uri extends `${string}{${infer Param}}${infer Rest}`
    ? Param | TemplateParamKeys<Rest>
    : never;

export type ResourceUriParams<Uri extends string> =
  [TemplateParamKeys<Uri>] extends [never]
    ? undefined
    : {
        [K in TemplateParamKeys<Uri>]: string;
      };

export type ResourceReadEvent<
  C extends ResourceContext = ResourceContext,
  P extends Record<string, string> | undefined =
    | Record<string, string>
    | undefined,
> = {
  ctx: C;
  request: ToolRequest;
  /** The exact URI that was requested. */
  uri: string;
} & ResourceParamShape<P>;

export type ResourceBeforeHookEvent<
  C extends ResourceContext = ResourceContext,
  P extends Record<string, string> | undefined =
    | Record<string, string>
    | undefined,
> = ResourceReadEvent<C, P>;

export type ResourceAfterHookEvent<
  C extends ResourceContext = ResourceContext,
  R = ResourceContents,
  P extends Record<string, string> | undefined =
    | Record<string, string>
    | undefined,
> = ResourceReadEvent<C, P> & {
  result: R;
};

export type ResourceErrorHookEvent<
  C extends ResourceContext = ResourceContext,
  P extends Record<string, string> | undefined =
    | Record<string, string>
    | undefined,
> = ResourceReadEvent<C, P> & {
  error: unknown;
};

export type ResourceAfterResponseHookEvent<
  C extends ResourceContext = ResourceContext,
  R = ResourceContents,
  P extends Record<string, string> | undefined =
    | Record<string, string>
    | undefined,
> = ResourceReadEvent<C, P> & {
  error?: unknown;
  result?: R;
};

export type ResourceHandler<
  C extends ResourceContext = ResourceContext,
  R = ResourceContents,
  P extends Record<string, string> | undefined =
    | Record<string, string>
    | undefined,
> = (event: ResourceReadEvent<C, P>) => R | Promise<R>;

export type ResourceNext<R = ResourceContents> = () => Promise<R>;

export type ResourceMiddlewareEvent<
  C extends ResourceContext = ResourceContext,
  R = ResourceContents,
  P extends Record<string, string> | undefined =
    | Record<string, string>
    | undefined,
> = ResourceReadEvent<C, P> & {
  next: ResourceNext<R>;
};

export type ResourceMiddleware<
  C extends ResourceContext = ResourceContext,
  R = ResourceContents,
  P extends Record<string, string> | undefined =
    | Record<string, string>
    | undefined,
> = (event: ResourceMiddlewareEvent<C, R, P>) => R | Promise<R>;

export type ResourceBeforeHook<
  C extends ResourceContext = ResourceContext,
  P extends Record<string, string> | undefined =
    | Record<string, string>
    | undefined,
> = (
  event: ResourceBeforeHookEvent<C, P>
) => void | Promise<void>;

export type ResourceAfterHook<
  C extends ResourceContext = ResourceContext,
  R = ResourceContents,
  P extends Record<string, string> | undefined =
    | Record<string, string>
    | undefined,
> = (
  event: ResourceAfterHookEvent<C, R, P>
) => R | void | Promise<R | void>;

export type ResourceErrorHook<
  C extends ResourceContext = ResourceContext,
  P extends Record<string, string> | undefined =
    | Record<string, string>
    | undefined,
> = (
  event: ResourceErrorHookEvent<C, P>
) => void | Promise<void>;

export type ResourceAfterResponseHook<
  C extends ResourceContext = ResourceContext,
  R = ResourceContents,
  P extends Record<string, string> | undefined =
    | Record<string, string>
    | undefined,
> = (
  event: ResourceAfterResponseHookEvent<C, R, P>
) => void | Promise<void>;

/**
 * Resource definition. Pass to app.resource(uri, def).
 *
 * Static:   app.resource("file:///config.json", { ... })
 * Template: app.resource("users://{id}/profile", { ... })
 *
 * Template variables are matched from the URI pattern and injected
 * into event.params. The pattern uses {varName} syntax.
 */
export interface ResourceDef<
  C extends Record<string, unknown> = {},
  P extends Record<string, string> | undefined =
    | Record<string, string>
    | undefined,
> {
  after?: ResourceAfterHook<ResourceContext<C>, ResourceContents, P>;
  afterResponse?: ResourceAfterResponseHook<
    ResourceContext<C>,
    ResourceContents,
    P
  >;
  before?: ResourceBeforeHook<ResourceContext<C>, P>;
  description?: string;
  handler: ResourceHandler<ResourceContext<C>, ResourceContents, P>;
  icons?: ServerIcon[];
  middleware?: ResourceMiddleware<ResourceContext<C>, ResourceContents, P>[];
  mimeType?: string;
  name: string;
  /**
   * Opt-in to resources/subscribe change notifications.
   * Call app.notifyResourceChanged(uri) to push a notification.
   */
  subscribe?: boolean;
}

export interface ResolvedResource {
  after?: ResourceAfterHook;
  afterResponse?: ResourceAfterResponseHook;
  before?: ResourceBeforeHook;
  description?: string;
  handler: ResourceHandler;
  icons?: ServerIcon[];
  /** True when the URI contains {variable} template syntax. */
  isTemplate: boolean;
  middleware?: ResourceMiddleware[];
  mimeType?: string;
  name: string;
  subscribe?: boolean;
  uri: string;
}

export interface PromptArgument {
  description?: string;
  name: string;
  required?: boolean;
}

type Simplify<T> = { [K in keyof T]: T[K] } & {};

type PromptRequiredArgumentNames<
  A extends readonly PromptArgument[],
> = Extract<A[number], { required: true }>["name"];

type PromptOptionalArgumentNames<
  A extends readonly PromptArgument[],
> = Exclude<A[number]["name"], PromptRequiredArgumentNames<A>>;

export type PromptArguments<
  A extends readonly PromptArgument[] | undefined,
> = [A] extends [undefined]
  ? undefined
  : A extends readonly PromptArgument[]
    ? Simplify<
        {
          [K in PromptRequiredArgumentNames<A>]: string;
        } & {
          [K in PromptOptionalArgumentNames<A>]?: string;
        }
      >
    : Record<string, string> | undefined;

export type InferPromptInput<
  S,
  A extends readonly PromptArgument[] | undefined,
> = [S] extends [undefined] ? PromptArguments<A> : InferSchemaOutput<S>;

type PromptArgumentShape<I> = [I] extends [undefined]
    ? { arguments?: undefined }
    : { arguments: I };

export interface PromptMessage {
  content:
    | { type: "text"; text: string }
    | { type: "image"; data: string; mimeType: string }
    | {
        type: "resource";
        resource: {
          uri: string;
          text?: string;
          blob?: string;
          mimeType?: string;
        };
      };
  role: "user" | "assistant";
}

export type PromptGetEvent<
  C extends PromptContext = PromptContext,
  I = Record<string, string> | undefined,
> = {
  ctx: C;
  name: string;
  request: ToolRequest;
} & PromptArgumentShape<I>;

export type PromptHandlerResult =
  | PromptMessage[]
  | { description?: string; messages: PromptMessage[] };

export type PromptBeforeHookEvent<
  C extends PromptContext = PromptContext,
  I = Record<string, string> | undefined,
> = PromptGetEvent<C, I>;

export type PromptAfterHookEvent<
  C extends PromptContext = PromptContext,
  R = PromptHandlerResult,
  I = Record<string, string> | undefined,
> = PromptGetEvent<C, I> & {
  result: R;
};

export type PromptErrorHookEvent<
  C extends PromptContext = PromptContext,
  I = Record<string, string> | undefined,
> = PromptGetEvent<C, I> & {
  error: unknown;
};

export type PromptAfterResponseHookEvent<
  C extends PromptContext = PromptContext,
  R = PromptHandlerResult,
  I = Record<string, string> | undefined,
> = PromptGetEvent<C, I> & {
  error?: unknown;
  result?: R;
};

export type PromptHandler<
  C extends PromptContext = PromptContext,
  R = PromptHandlerResult,
  I = Record<string, string> | undefined,
> = (event: PromptGetEvent<C, I>) => R | Promise<R>;

export type PromptNext<R = PromptHandlerResult> = () => Promise<R>;

export type PromptMiddlewareEvent<
  C extends PromptContext = PromptContext,
  R = PromptHandlerResult,
  I = Record<string, string> | undefined,
> = PromptGetEvent<C, I> & {
  next: PromptNext<R>;
};

export type PromptMiddleware<
  C extends PromptContext = PromptContext,
  R = PromptHandlerResult,
  I = Record<string, string> | undefined,
> = (event: PromptMiddlewareEvent<C, R, I>) => R | Promise<R>;

export type PromptBeforeHook<
  C extends PromptContext = PromptContext,
  I = Record<string, string> | undefined,
> = (
  event: PromptBeforeHookEvent<C, I>
) => void | Promise<void>;

export type PromptAfterHook<
  C extends PromptContext = PromptContext,
  R = PromptHandlerResult,
  I = Record<string, string> | undefined,
> = (event: PromptAfterHookEvent<C, R, I>) => R | void | Promise<R | void>;

export type PromptErrorHook<
  C extends PromptContext = PromptContext,
  I = Record<string, string> | undefined,
> = (
  event: PromptErrorHookEvent<C, I>
) => void | Promise<void>;

export type PromptAfterResponseHook<
  C extends PromptContext = PromptContext,
  R = PromptHandlerResult,
  I = Record<string, string> | undefined,
> = (
  event: PromptAfterResponseHookEvent<C, R, I>
) => void | Promise<void>;

/**
 * Prompt definition. Pass to app.prompt(name, def).
 *
 * @example
 * app.prompt("summarise", {
 *   description: "Summarise a block of text",
 *   arguments: [
 *     { name: "text",   description: "Text to summarise", required: true },
 *     { name: "length", description: "Target length in words" },
 *   ],
 *   handler: ({ arguments: args }) => [
 *     { role: "user", content: { type: "text", text: `Summarise:\n${args.text}` } },
 *   ],
 * });
 */
export interface PromptDef<
  C extends Record<string, unknown> = {},
  A extends readonly PromptArgument[] | undefined =
    | readonly PromptArgument[]
    | undefined,
  S = undefined,
  I = InferPromptInput<S, A>,
> {
  after?: PromptAfterHook<PromptContext<C>, PromptHandlerResult, I>;
  afterResponse?: PromptAfterResponseHook<
    PromptContext<C>,
    PromptHandlerResult,
    I
  >;
  arguments?: A;
  argumentsSchema?: S;
  before?: PromptBeforeHook<PromptContext<C>, I>;
  description?: string;
  handler: PromptHandler<PromptContext<C>, PromptHandlerResult, I>;
  middleware?: PromptMiddleware<PromptContext<C>, PromptHandlerResult, I>[];
}

export interface ResolvedPrompt {
  after?: PromptAfterHook<PromptContext, PromptHandlerResult, unknown>;
  afterResponse?: PromptAfterResponseHook<
    PromptContext,
    PromptHandlerResult,
    unknown
  >;
  arguments?: readonly PromptArgument[];
  before?: PromptBeforeHook<PromptContext, unknown>;
  description?: string;
  handler: PromptHandler<PromptContext, PromptHandlerResult, unknown>;
  middleware?: PromptMiddleware<PromptContext, PromptHandlerResult, unknown>[];
  name: string;
}
