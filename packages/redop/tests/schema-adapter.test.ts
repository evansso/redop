import { describe, expect, test } from "bun:test";
import { z } from "zod";

import type { RequestMeta } from "../src/index";
import { middleware, Redop } from "../src/index";

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

describe("Standard Schema adapter", () => {
  test("infers handler event input from Zod v4 output types", async () => {
    const app = new Redop().tool("typed_defaults", {
      input: z.object({
        limit: z.number().default(10),
        page: z.coerce.number(),
        query: z.string().optional(),
      }),
      handler: ({ input, request }) => {
        expectType<number>(input.limit);
        expectType<number>(input.page);
        expectType<string | undefined>(input.query);
        expectType<"stdio" | "http" | "ws">(request.transport);

        return input;
      },
    });

    expect(await runTool(app, "typed_defaults", { page: "2" })).toEqual({
      limit: 10,
      page: 2,
      query: undefined,
    });
  });

  test("uses Zod v4 JSON Schema generation for tool metadata", () => {
    const app = new Redop().tool("typed_defaults", {
      input: z.object({
        limit: z.number().default(10),
        page: z.coerce.number(),
      }),
      handler: ({ input }) => ({ limit: input.limit, page: input.page }),
    });

    expect(app.getTool("typed_defaults")?.inputSchema).toMatchObject({
      $schema: "http://json-schema.org/draft-07/schema#",
      type: "object",
      properties: {
        limit: { default: 10, type: "number" },
        page: { type: "number" },
      },
    });
  });

  test("preserves validation issues when parsing fails", async () => {
    const app = new Redop().tool("typed_defaults", {
      input: z.object({
        page: z.coerce.number(),
      }),
      handler: ({ input }) => ({ page: input.page }),
    });

    try {
      await runTool(app, "typed_defaults", { page: "oops" });
      throw new Error("Expected validation to fail");
    } catch (error) {
      const validationError = error as Error & {
        issues?: Array<{ message: string; path?: PropertyKey[] }>;
      };

      expect(validationError.message).toContain(
        'Validation failed for tool "typed_defaults"'
      );
      expect(validationError.issues?.[0]?.message).toContain("Invalid input");
      expect(validationError.issues?.[0]?.path).toEqual(["page"]);
    }
  });

  test("keeps plain JSON Schema tools working", async () => {
    const app = new Redop().tool("echo", {
      input: {
        type: "object",
        properties: {
          message: { type: "string" },
        },
        required: ["message"],
      },
      handler: ({ input }) => input.message,
    });

    expect(await runTool(app, "echo", { message: "hello" })).toBe("hello");
  });

  test("middleware can read typed input and request metadata", async () => {
    const seen: Array<unknown> = [];

    const app = new Redop()
      .use(
        middleware<{ page: number }>(async ({ input, request, next }) => {
          expectType<number>(input.page);
          seen.push({
            page: input.page,
            ip: request.ip,
            url: request.url,
          });
          return next();
        })
      )
      .tool("typed_defaults", {
        input: z.object({
          page: z.coerce.number(),
        }),
        handler: ({ input, request }) => ({
          page: input.page,
          ip: request.ip,
          hasRaw: request.raw instanceof Request,
        }),
      });

    expect(
      await runTool(app, "typed_defaults", { page: "3" }, {
        headers: { authorization: "Bearer dev-secret" },
        ip: "127.0.0.1",
        method: "POST",
        raw: new Request("http://localhost:3000/mcp", { method: "POST" }),
        transport: "http",
        url: "http://localhost:3000/mcp",
      })
    ).toEqual({
      page: 3,
      ip: "127.0.0.1",
      hasRaw: true,
    });

    expect(seen).toEqual([
      {
        page: 3,
        ip: "127.0.0.1",
        url: "http://localhost:3000/mcp",
      },
    ]);
  });

  test("tool-local before and after hooks are typed and ordered around the handler", async () => {
    const order: string[] = [];

    const app = new Redop()
      .onBeforeHandle(() => {
        order.push("global-before");
      })
      .onAfterHandle(() => {
        order.push("global-after");
      })
      .use(
        middleware<{ page: number }>(async ({ next }) => {
          order.push("middleware");
          return next();
        })
      )
      .tool("typed_defaults", {
        input: z.object({
          page: z.coerce.number(),
        }),
        before: ({ input, request }) => {
          expectType<number>(input.page);
          expectType<"stdio" | "http" | "ws">(request.transport);
          order.push("tool-before");
        },
        handler: ({ input }) => {
          order.push("handler");
          return { page: input.page, ok: true };
        },
        after: ({ input, result, request }) => {
          expectType<number>(input.page);
          expectType<number>(result.page);
          expectType<boolean>(result.ok);
          expectType<"stdio" | "http" | "ws">(request.transport);
          order.push("tool-after");
        },
      });

    expect(await runTool(app, "typed_defaults", { page: "4" })).toEqual({
      ok: true,
      page: 4,
    });

    expect(order).toEqual([
      "global-before",
      "tool-before",
      "middleware",
      "handler",
      "tool-after",
      "global-after",
    ]);
  });

  test("tool-local after does not run when middleware or handler fails", async () => {
    const seen: string[] = [];

    const failingHandler = new Redop().tool("boom_handler", {
      before: () => {
        seen.push("handler-before");
      },
      handler: () => {
        seen.push("handler");
        throw new Error("handler failed");
      },
      after: () => {
        seen.push("handler-after");
      },
    });

    await expect(runTool(failingHandler, "boom_handler", {})).rejects.toThrow(
      "handler failed"
    );
    expect(seen).toEqual(["handler-before", "handler"]);

    seen.length = 0;

    const failingMiddleware = new Redop()
      .use(
        middleware(async () => {
          seen.push("middleware");
          throw new Error("middleware failed");
        })
      )
      .tool("boom_middleware", {
        before: () => {
          seen.push("middleware-before");
        },
        handler: () => {
          seen.push("middleware-handler");
          return { ok: true };
        },
        after: () => {
          seen.push("middleware-after");
        },
      });

    await expect(
      runTool(failingMiddleware, "boom_middleware", {})
    ).rejects.toThrow("middleware failed");
    expect(seen).toEqual(["middleware-before", "middleware"]);
  });
});
