import { z } from "zod";

import { Redop, type PromptArguments } from "../src/index";

type Expect<T extends true> = T;

type _PromptArguments = Expect<
  PromptArguments<
    readonly [{ name: "text"; required: true }, { name: "style" }]
  > extends {
    text: string;
    style?: string;
  }
    ? true
    : false
>;

new Redop()
  .prompt("summarise", {
    arguments: [{ name: "text", required: true }, { name: "style" }],
    handler: ({ arguments: args }) => {
      const text: string = args.text;
      const style: string | undefined = args.style;

      return [
        {
          role: "user",
          content: {
            type: "text",
            text: `${style ?? "default"}:${text}`,
          },
        },
      ];
    },
  })
  .prompt("healthcheck", {
    handler: ({ arguments: args }) => {
      const noArguments: undefined = args;

      return [
        {
          role: "user",
          content: {
            type: "text",
            text: String(noArguments),
          },
        },
      ];
    },
  })
  .prompt("summarise_schema", {
    argumentsSchema: z.object({
      limit: z.coerce.number().int(),
      topic: z.string(),
    }),
    handler: ({ arguments: args }) => {
      const limit: number = args.limit;
      const topic: string = args.topic;

      return [
        {
          role: "user",
          content: {
            type: "text",
            text: `${topic}:${limit}`,
          },
        },
      ];
    },
  });
