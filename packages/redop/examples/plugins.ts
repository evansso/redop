// ─────────────────────────────────────────────
//  redop — plugin example
//  Run: bun run examples/plugins.ts
// ─────────────────────────────────────────────

import {
  apiKey,
  definePlugin,
  jwt,
  logger,
  middleware,
  Redop,
} from "../src/index";

const timingPlugin = definePlugin({
  description: "Attach timing data to every tool request.",
  name: "timing",
  version: "0.1.0",
  setup() {
    return new Redop<{ startedAt?: number }>()
      .onBeforeHandle(({ ctx }) => {
        ctx.startedAt = performance.now();
      })
      .onAfterHandle(({ ctx, tool }) => {
        const startedAt = ctx.startedAt;
        if (startedAt == null) {
          return;
        }

        const ms = +(performance.now() - startedAt).toFixed(2);
        console.log(`[timing] ${tool} finished in ${ms}ms`);
      });
  },
});

const requestIdPrefix = middleware<unknown, { shortRequestId: string }>(
  async ({ ctx, next }) => {
    ctx.shortRequestId = ctx.requestId.slice(0, 8);
    return next();
  }
);

new Redop({
  serverInfo: {
    description: "Plugin example server",
    name: "plugin-example",
    title: "Plugin Example",
    version: "0.1.0",
  },
})
  .use(logger({ level: "info" }))
  .use(
    apiKey({
      key: process.env.API_SECRET ?? "dev-secret",
    })
  )
  .use(
    jwt({
      optional: true,
      secret: process.env.JWT_SECRET ?? "dev-jwt-secret",
    })
  )
  .use(timingPlugin({}))
  .use(requestIdPrefix)
  .tool("hello", {
    description: "Say hello and show middleware/plugin context",
    inputSchema: {
      properties: {
        name: { type: "string" },
      },
      required: ["name"],
      type: "object",
    },
    handler: ({ ctx, input }) => ({
      greeting: `Hello, ${input.name}!`,
      requestId: ctx.requestId,
      shortRequestId: ctx.shortRequestId,
    }),
  })
  .listen({
    cors: true,
    onListen: ({ url }) => {
      console.log(`plugin example → ${url}`);
      console.log("Use header: x-api-key: dev-secret");
    },
    port: process.env.PORT ?? 3000,
  });
