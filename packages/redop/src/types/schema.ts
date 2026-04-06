export interface StandardSchemaResultSuccess<o> {
  readonly issues?: undefined;
  readonly value: o;
}
export interface StandardSchemaIssue {
  readonly message: string;
  readonly path?: readonly (PropertyKey | { readonly key: PropertyKey })[];
}
export interface StandardSchemaResultFailure {
  readonly issues: readonly StandardSchemaIssue[];
}
export interface StandardSchemaJsonOptions {
  readonly libraryOptions?: Record<string, unknown>;
  readonly target: string;
}

export interface StandardSchemaV1<Input = unknown, Output = Input> {
  readonly "~standard": {
    readonly jsonSchema?: {
      readonly input: (o: StandardSchemaJsonOptions) => Record<string, unknown>;
      readonly output: (
        o: StandardSchemaJsonOptions
      ) => Record<string, unknown>;
    };
    readonly validate: (
      value: unknown,
      options?: { readonly libraryOptions?: Record<string, unknown> }
    ) =>
      | StandardSchemaResultSuccess<Output>
      | StandardSchemaResultFailure
      | Promise<
          StandardSchemaResultSuccess<Output> | StandardSchemaResultFailure
        >;
    readonly types?: { readonly input: Input; readonly output: Output };
    readonly vendor: string;
    readonly version: 1;
  };
}

export type InferSchemaOutput<S> =
  S extends StandardSchemaV1<any, infer O>
    ? O
    : S extends Record<string, unknown>
      ? Record<string, unknown>
      : unknown;

export interface SchemaAdapter<S = unknown, P = InferSchemaOutput<S>> {
  parse(schema: S, input: unknown): P | Promise<P>;
  toJsonSchema(schema: S): Record<string, unknown>;
}
