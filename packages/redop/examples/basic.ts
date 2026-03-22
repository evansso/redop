import { analytics, logger, Redop, rateLimit } from "../src/index";

new Redop()
  .use(logger({ level: "info" }))
  .use(analytics({ sink: "console" }))
  .use(rateLimit({ max: 100, window: "1m" }))
  .onBeforeHandle(({ ctx }) => {
    ctx.startedAt = performance.now();
  })
  .tool("ping", {
    description: "Health check",
    handler: () => ({ pong: true, ts: Date.now() }),
  })
  .tool("echo", {
    handler: ({ input }) =>
      typeof input.message === "string"
        ? input.message.toUpperCase()
        : input.message,
    input: {
      type: "object",
      properties: { message: { type: "string" } },
      required: ["message"],
    },
  })
  .listen({
    cors: true,
    hostname: "0.0.0.0",
    onListen: ({ url }) => console.log(`redop ready → ${url}`),
    port: process.env.PORT ?? 3000,
  });
