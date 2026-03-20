# redop

Bun-native MCP server framework for building typed tools, middleware, hooks, and plugins.

## Why Redop

Redop is designed for Bun-first MCP servers that should feel small, typed, and composable.

- typed handlers with Zod support
- HTTP and stdio transports
- middleware and lifecycle hooks
- reusable plugin composition
- Bun-native production deployment shape

## Installation

Install the package directly:

```sh
bun add redop zod
```

Or scaffold a full app:

```sh
bun create redop-app
```

## Quick start

```ts
import { Redop } from "redop";
import { z } from "zod";

new Redop({
  name: "my-mcp-server",
  version: "0.1.0",
})
  .tool("search", {
    description: "Search the web",
    input: z.object({
      query: z.string().min(1),
    }),
    handler: ({ input }) => {
      return {
        query: input.query,
        results: [],
      };
    },
  })
  .listen({
    port: Number(process.env.PORT ?? 3000),
    hostname: "0.0.0.0",
    cors: true,
    onListen: ({ url }) => {
      console.log(`redop ready -> ${url}`);
    },
  });
```

## Core concepts

### Tools

Use `.tool(...)` to register MCP tools.

```ts
app.tool("ping", {
  description: "Health check",
  handler: () => ({ ok: true }),
});
```

### Typed input

Pass a Zod schema to get typed handler input.

```ts
app.tool("search", {
  input: z.object({
    query: z.string(),
    limit: z.number().int().min(1).max(50).default(10),
  }),
  handler: ({ input }) => {
    return search(input.query, input.limit);
  },
});
```

### Middleware

Middleware wraps tool execution and can read request metadata and mutate `ctx`.

```ts
import { middleware } from "redop";

app.use(
  middleware(async ({ request, ctx, next }) => {
    ctx.startedAt = performance.now();
    console.log(request.transport);
    return next();
  })
);
```

### Hooks

Use global hooks for cross-cutting behavior.

```ts
app
  .onBeforeHandle(({ ctx }) => {
    ctx.startedAt = performance.now();
  })
  .onAfterHandle(({ tool, ctx }) => {
    console.log(tool, performance.now() - ctx.startedAt);
  });
```

### Plugins

Any `Redop` instance can be reused as a plugin with `.use(...)`.

```ts
import { analytics, logger, rateLimit } from "redop";

app
  .use(logger({ level: "info" }))
  .use(analytics({ sink: "console" }))
  .use(rateLimit({ max: 60, window: "1m" }));
```

## Transports

### HTTP

Use HTTP for hosted MCP servers:

```ts
app.listen({
  port: Number(process.env.PORT ?? 3000),
  hostname: "0.0.0.0",
  cors: true,
});
```

Auto-mounted routes:

- `POST /mcp`
- `GET /mcp`
- `DELETE /mcp`
- `GET /mcp/health`
- `GET /mcp/schema`

### STDIO

Use stdio for local MCP host integrations:

```ts
app.listen({
  transport: "stdio",
});
```

## Lifecycle

Execution order:

```txt
onTransform -> onBeforeHandle -> tool.before -> middleware -> handler -> tool.after -> onAfterHandle -> mapResponse
```

## Schema support

Redop works with:

- Zod
- JSON Schema
- Standard Schema
- custom adapters

Example:

```ts
app.tool("echo", {
  input: {
    type: "object",
    properties: {
      message: { type: "string" },
    },
    required: ["message"],
  },
  handler: ({ input }) => input.message,
});
```

## Production shape

For production, the default Bun HTTP shape is:

```ts
app.listen({
  port: Number(process.env.PORT ?? 3000),
  hostname: "0.0.0.0",
  cors: true,
});
```

Use:

- `process.env.PORT`
- `0.0.0.0`
- `/mcp/health` for health checks

## Examples

See the local examples:

- [`basic.ts`](/home/evans/projects/redop-ai/packages/redop/examples/basic.ts)
- [`with-zod.ts`](/home/evans/projects/redop-ai/packages/redop/examples/with-zod.ts)
- [`plugins.ts`](/home/evans/projects/redop-ai/packages/redop/examples/plugins.ts)

## Documentation

- Docs site: https://redop.useagents.site
- Docs source: [`apps/docs`](/home/evans/projects/redop-ai/apps/docs)

## License

MIT © UseAgents
