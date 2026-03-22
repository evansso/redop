import { describe, expect, test } from "bun:test";

import type { Context, PluginFactory, RequestMeta } from "../src/index";
import { definePlugin, middleware, Redop } from "../src/index";

function expectType<T>(_value: T) {}

async function runTool(
  app: Redop,
  name: string,
  args: Record<string, unknown>,
  requestMeta: RequestMeta = {
    headers: {},
    transport: "stdio",
  }
) {
  return (
    app as unknown as {
      _runTool: (
        toolName: string,
        rawArgs: Record<string, unknown>,
        meta?: RequestMeta
      ) => Promise<unknown>;
    }
  )._runTool(name, args, requestMeta);
}

describe("plugin api", () => {
  test("definePlugin preserves options typing and exposes metadata", () => {
    const plugin = definePlugin<{ enabled: boolean }>({
      description: "typed plugin example",
      name: "typed-plugin",
      setup: (opts) => {
        expectType<boolean>(opts.enabled);
        return new Redop();
      },
      version: "0.1.0",
    });

    expectType<PluginFactory<{ enabled: boolean }>>(plugin);
    expect(plugin.meta).toEqual({
      description: "typed plugin example",
      name: "typed-plugin",
      version: "0.1.0",
    });
  });

  test("plugin factories compose middleware hooks and tools via .use()", async () => {
    type AppCtx = Context<{
      tenantId?: string;
      startedByPlugin?: boolean;
    }>;

    const tenantPlugin = definePlugin<{ header?: string }, AppCtx>({
      name: "tenant-plugin",
      setup: (opts) =>
        new Redop<AppCtx>()
          .use(
            middleware<unknown, AppCtx>(async ({ request, ctx, next }) => {
              const header = (opts.header ?? "x-tenant-id").toLowerCase();
              ctx.tenantId = request.headers[header] ?? "public";
              return next();
            })
          )
          .onBeforeHandle(({ ctx }) => {
            ctx.startedByPlugin = true;
          })
          .tool("whoami", {
            handler: ({ ctx, request }) => ({
              startedByPlugin: ctx.startedByPlugin ?? false,
              tenantId: ctx.tenantId ?? "public",
              transport: request.transport,
            }),
          }),
      version: "0.1.0",
    });

    const app = new Redop<AppCtx>().use(
      tenantPlugin({ header: "x-tenant-id" })
    );

    expect(
      await runTool(
        app,
        "whoami",
        {},
        {
          headers: { "x-tenant-id": "acme" },
          transport: "http",
        }
      )
    ).toEqual({
      startedByPlugin: true,
      tenantId: "acme",
      transport: "http",
    });
  });

  test("optional namespacing prevents plugin tool collisions", async () => {
    const notesPlugin = definePlugin<{ namespace?: string }>({
      name: "notes-plugin",
      setup: ({ namespace }) => {
        const plugin = new Redop();

        const register = (app: Redop) =>
          app.tool("list", {
            handler: () => ({ ok: true }),
          });

        if (namespace) {
          plugin.group(namespace, register);
        } else {
          register(plugin);
        }

        return plugin;
      },
      version: "0.1.0",
    });

    const app = new Redop()
      .use(notesPlugin({ namespace: "alpha" }))
      .use(notesPlugin({ namespace: "beta" }));

    expect(app.toolNames).toEqual(["alpha_list", "beta_list"]);
    await expect(runTool(app, "alpha_list", {})).resolves.toEqual({ ok: true });
    await expect(runTool(app, "beta_list", {})).resolves.toEqual({ ok: true });
  });

  test("plugin metadata remains descriptive and reusable", () => {
    const requestAwarePlugin = definePlugin<{ namespace?: string }>({
      description: "Reads request headers and exposes namespaced tools.",
      name: "request-aware-plugin",
      setup: ({ namespace }) => {
        const plugin = new Redop();
        const prefix = namespace ?? "request";
        plugin.group(prefix, (grouped) =>
          grouped.tool("headers", {
            handler: ({ request }) => request.headers,
          })
        );
        return plugin;
      },
      version: "0.2.0",
    });

    expect(requestAwarePlugin.meta.name).toBe("request-aware-plugin");
    expect(requestAwarePlugin.meta.version).toBe("0.2.0");
    expect(requestAwarePlugin.meta.description).toContain("headers");
  });

  test("auth plugin can attach reusable metadata to ctx", async () => {
    type AppCtx = Context<{
      auth?: {
        keyId: string;
        owner: string;
        plan: "free" | "pro";
      };
    }>;

    const authPlugin = definePlugin<{ headerName?: string }, AppCtx>({
      name: "auth-plugin",
      setup: ({ headerName = "x-api-key" }) =>
        middleware<unknown, AppCtx>(async ({ request, ctx, next }) => {
          const key = request.headers[headerName];
          if (key === "demo-pro-key") {
            ctx.auth = {
              keyId: "key_pro_456",
              owner: "globex",
              plan: "pro",
            };
            return next();
          }

          throw new Error("Unauthorized");
        }),
      version: "0.1.0",
    });

    const app = new Redop<AppCtx>()
      .use(authPlugin({ headerName: "x-api-key" }))
      .tool("me", {
        handler: ({ ctx }) => ctx.auth ?? null,
      });

    await expect(
      runTool(
        app,
        "me",
        {},
        {
          headers: { "x-api-key": "demo-pro-key" },
          transport: "http",
        }
      )
    ).resolves.toEqual({
      keyId: "key_pro_456",
      owner: "globex",
      plan: "pro",
    });
  });

  test("rate limit plugin can key off authenticated metadata", async () => {
    type AppCtx = Context<{
      auth?: {
        keyId: string;
      };
    }>;

    const authPlugin = definePlugin<{}, AppCtx>({
      name: "auth-plugin",
      setup: () =>
        middleware<unknown, AppCtx>(async ({ ctx, next }) => {
          ctx.auth = { keyId: "shared-key" };
          return next();
        }),
      version: "0.1.0",
    });

    const rateLimitPlugin = definePlugin<{ max?: number }, AppCtx>({
      name: "rate-limit-plugin",
      setup: ({ max = 1 }) => {
        const hits = new Map<string, number>();

        return middleware<unknown, AppCtx>(async ({ ctx, request, next }) => {
          const key = ctx.auth?.keyId ?? request.ip ?? "anonymous";
          const count = hits.get(key) ?? 0;
          if (count >= max) {
            throw new Error(`Rate limit exceeded for ${key}`);
          }
          hits.set(key, count + 1);
          return next();
        });
      },
      version: "0.1.0",
    });

    const app = new Redop<AppCtx>()
      .use(authPlugin({}))
      .use(rateLimitPlugin({ max: 1 }))
      .tool("ping", {
        handler: ({ ctx }) => ({ keyId: ctx.auth?.keyId ?? null, ok: true }),
      });

    await expect(
      runTool(
        app,
        "ping",
        {},
        {
          headers: { "x-api-key": "demo-pro-key" },
          ip: "127.0.0.1",
          transport: "http",
        }
      )
    ).resolves.toEqual({ keyId: "shared-key", ok: true });

    await expect(
      runTool(
        app,
        "ping",
        {},
        {
          headers: { "x-api-key": "another-key-same-consumer" },
          ip: "127.0.0.1",
          transport: "http",
        }
      )
    ).rejects.toThrow("Rate limit exceeded for shared-key");
  });
});
