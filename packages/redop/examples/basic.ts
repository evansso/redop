import { Redop } from "../src/index";

new Redop<{ startedAt?: number }>({
  serverInfo: {
    name: "redop",
    title: "Redop",
    description: "Hello mcp world",
  },
})
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
    inputSchema: {
      type: "object",
      properties: { message: { type: "string" } },
      required: ["message"],
    },
  })
  .listen(3000);
