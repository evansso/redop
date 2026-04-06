// ─────────────────────────────────────────────
//  redop — feature module composition example
//  Run: bun run examples/modules.ts
// ─────────────────────────────────────────────

import { Redop } from "../src/index";

const notes = new Redop()
  .tool("notes.list", {
    description: "List notes",
    handler: () => ({
      notes: [
        { id: "1", title: "Ship modules example" },
        { id: "2", title: "Keep names explicit" },
      ],
    }),
  })
  .tool("notes.create", {
    description: "Create a note",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string" },
      },
      required: ["title"],
    },
    handler: ({ input }) => ({
      created: {
        id: crypto.randomUUID().slice(0, 8),
        title: input.title,
      },
    }),
  })
  .resource("notes://{id}", {
    name: "Note",

    handler: async ({ params }) => ({
      type: "text",
      text: JSON.stringify({ id: params.id, title: "Example note" }),
    }),
  });

const users = new Redop().tool("users.get", {
  description: "Get a user by ID",
  inputSchema: {
    type: "object",
    properties: {
      id: { type: "string" },
    },
    required: ["id"],
  },
  handler: ({ input }) => ({
    id: input.id,
    name: "Ada Lovelace",
  }),
});

new Redop({
  serverInfo: {
    description: "Feature-module composition example server",
    name: "modules-example",
    title: "Modules Example",
    version: "0.1.0",
  },
})
  .use(notes)
  .use(users)
  .listen({
    cors: true,
    onListen: ({ url }) => {
      console.log(`modules example → ${url}`);
    },
    port: process.env.PORT ?? 3000,
  });
