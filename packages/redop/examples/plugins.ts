import type { Context, ToolHandlerEvent } from "../src/index";
import { definePlugin, middleware, Redop } from "../src/index";

type AuthMeta = {
  keyId: string;
  owner: string;
  plan: "free" | "pro";
};

type ExampleCtx = Context<{
  auth?: AuthMeta;
  tenantId?: string;
}>;

const API_KEYS: Record<string, AuthMeta> = {
  "demo-free-key": {
    keyId: "key_free_123",
    owner: "acme-inc",
    plan: "free",
  },
  "demo-pro-key": {
    keyId: "key_pro_456",
    owner: "globex",
    plan: "pro",
  },
};

function resolveRateLimitKey(event: ToolHandlerEvent<unknown, ExampleCtx>): string {
  return (
    event.ctx.auth?.keyId ??
    event.request.ip ??
    event.request.headers["x-forwarded-for"]?.split(",")[0]?.trim() ??
    event.ctx.requestId
  );
}

export const apiKeyAuthPlugin = definePlugin<{
  headerName?: string;
  lookup?: (apiKey: string) => AuthMeta | Promise<AuthMeta | null> | null;
}>({
  name: "example-api-key-auth",
  version: "0.1.0",
  description:
    "Validate x-api-key headers and attach reusable auth metadata to ctx.",
  setup: (opts) =>
    middleware<unknown, ExampleCtx>(async ({ request, ctx, next }) => {
      if (request.transport !== "http") {
        return next();
      }

      const headerName = (opts.headerName ?? "x-api-key").toLowerCase();
      const apiKey = request.headers[headerName];
      if (!apiKey) {
        throw new Error(`Unauthorized: missing ${headerName} header`);
      }

      const lookup =
        opts.lookup ??
        ((value: string) => Promise.resolve(API_KEYS[value] ?? null));
      const auth = await lookup(apiKey);

      if (!auth) {
        throw new Error("Unauthorized: invalid API key");
      }

      ctx.auth = auth;
      return next();
    }),
});

export const tenantPlugin = definePlugin<{
  header?: string;
}>({
  name: "tenant-plugin",
  version: "0.1.0",
  description: "Attach tenant information from request headers to ctx.",
  setup: (opts) =>
    middleware<unknown, ExampleCtx>(async ({ request, ctx, next }) => {
      const headerName = (opts.header ?? "x-tenant-id").toLowerCase();
      ctx.tenantId = request.headers[headerName] ?? ctx.auth?.owner ?? "public";
      return next();
    }),
});

export const authRateLimitPlugin = definePlugin<{
  max?: number;
  namespace?: string;
  windowMs?: number;
}>({
  name: "example-auth-rate-limit",
  version: "0.1.0",
  description:
    "Rate limit requests by authenticated key metadata first, then IP fallback.",
  setup: (opts) => {
    const max = opts.max ?? 60;
    const windowMs = opts.windowMs ?? 60_000;
    const hits = new Map<string, number[]>();
    const plugin = middleware<unknown, ExampleCtx>(async (event) => {
      const key = resolveRateLimitKey(event);
      const now = Date.now();
      const timestamps = (hits.get(key) ?? []).filter(
        (value) => now - value < windowMs
      );

      if (timestamps.length >= max) {
        throw new Error(`Rate limit exceeded for ${key}`);
      }

      timestamps.push(now);
      hits.set(key, timestamps);
      return event.next();
    });

    const tools = new Redop<ExampleCtx>();
    const namespace = opts.namespace;

    const registerTools = (app: Redop<ExampleCtx>) =>
      app.tool("status", {
        handler: ({ ctx, request }) => ({
          auth: ctx.auth ?? null,
          key: ctx.auth?.keyId ?? request.ip ?? "anonymous",
          tenantId: ctx.tenantId ?? null,
          transport: request.transport,
        }),
      });

    if (namespace) {
      tools.group(namespace, registerTools);
    } else {
      registerTools(tools);
    }

    return new Redop<ExampleCtx>().use(plugin).use(tools);
  },
});

export const notesPlugin = definePlugin<{
  namespace?: string;
}>({
  name: "notes-plugin",
  version: "0.1.0",
  description: "Example third-party plugin that bundles namespaced tools.",
  setup: (opts) => {
    const namespace = opts.namespace;
    const plugin = new Redop<ExampleCtx>();

    const registerTools = (app: Redop<ExampleCtx>) =>
      app
        .tool("list", {
          handler: ({ ctx }) => ({
            notes: ["draft architecture doc", "ship analytics plugin"],
            tenant: ctx.tenantId ?? "public",
            auth: ctx.auth ?? null,
          }),
        })
        .tool("status", {
          handler: ({ tool, request, ctx }) => ({
            authOwner: ctx.auth?.owner ?? null,
            tool,
            transport: request.transport,
            viaPlugin: notesPlugin.meta.name,
          }),
        });

    if (namespace) {
      plugin.group(namespace, registerTools);
    } else {
      registerTools(plugin);
    }

    return plugin;
  },
});

new Redop<ExampleCtx>()
  .use(apiKeyAuthPlugin({ headerName: "x-api-key" }))
  .use(tenantPlugin({ header: "x-tenant-id" }))
  .use(authRateLimitPlugin({ max: 100, namespace: "limits" }))
  .use(notesPlugin({ namespace: "notes" }));
