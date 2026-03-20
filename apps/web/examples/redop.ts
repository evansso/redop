import { Redop } from "redop";
import z from "zod";

const docsAppp = new Redop().tool("search_doc", {
  description: "Search tool documentation",
  input: z.object({
    query: z.string(),
  }),
  handler: ({ input }) => {
    return { query: input.query };
  },
});

new Redop({
  name: "redop-mcp",
  version: "0.1.0",
})
  .use(docsAppp)
  .tool("search_docs", {
    description: "Search tool documentation",
    input: z.object({
      query: z.string(),
    }),
    handler: ({ input }) => {
      return { query: input.query };
    },
  })
  .listen({
    port: process.env.PORT ?? 3000,
    hostname: "0.0.0.0",
    cors: true,
    onListen: ({ url }) => {
      console.log(`■ Redop is running at ${url}`);
    },
  });
