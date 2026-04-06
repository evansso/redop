import { Redop, type ResourceUriParams } from "../src/index";

type Expect<T extends true> = T;

type _SingleTemplateParam = Expect<
  ResourceUriParams<"notes://{id}"> extends { id: string } ? true : false
>;
type _MultipleTemplateParams = Expect<
  ResourceUriParams<"notes://{noteId}/comments/{commentId}"> extends {
    commentId: string;
    noteId: string;
  }
    ? true
    : false
>;
type _StaticResourceParams = Expect<
  [ResourceUriParams<"notes://index">] extends [undefined] ? true : false
>;

new Redop()
  .resource("notes://{id}", {
    name: "Note",
    handler: ({ params }) => {
      const id: string = params.id;
      return { type: "text", text: id };
    },
  })
  .resource("notes://index", {
    name: "Notes index",
    handler: ({ params }) => {
      const noParams: undefined = params;
      return { type: "text", text: String(noParams) };
    },
  });
