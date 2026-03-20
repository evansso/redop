// ─────────────────────────────────────────────
//  redop — schema adapters
// ─────────────────────────────────────────────

import type {
  InferSchemaOutput,
  SchemaAdapter,
  StandardSchemaIssue,
  StandardSchemaV1,
} from "../types";

type JsonSchema = Record<string, unknown>;

function hasRecordShape(value: unknown): value is JsonSchema {
  return typeof value === "object" && value !== null;
}

function isStandardSchema(schema: unknown): schema is StandardSchemaV1 {
  if (!hasRecordShape(schema) || !("~standard" in schema)) return false;

  const standard = schema["~standard"];
  return (
    hasRecordShape(standard) &&
    typeof standard.validate === "function" &&
    standard.version === 1
  );
}

function isJsonSchema(schema: unknown): schema is JsonSchema {
  return (
    hasRecordShape(schema) &&
    ("type" in schema || "properties" in schema || "$schema" in schema)
  );
}

type StandardSchemaWithJson<S extends StandardSchemaV1 = StandardSchemaV1> = S & {
  readonly "~standard": S["~standard"] & {
    readonly jsonSchema: NonNullable<S["~standard"]["jsonSchema"]>;
  };
};

function hasJsonSchemaSupport<S extends StandardSchemaV1>(
  schema: S
): schema is StandardSchemaWithJson<S> {
  return typeof schema["~standard"].jsonSchema?.input === "function";
}

function createValidationError(issues: ReadonlyArray<StandardSchemaIssue>) {
  const error = new Error("Validation failed") as Error & {
    issues: ReadonlyArray<StandardSchemaIssue>;
  };
  error.issues = issues;
  return error;
}

export function standardSchemaAdapter<
  S extends StandardSchemaV1 = StandardSchemaV1,
>(): SchemaAdapter<S, InferSchemaOutput<S>> {
  return {
    toJsonSchema(schema) {
      if (!hasJsonSchemaSupport(schema)) {
        throw new Error(
          "[redop] Schema provides validation but not JSON Schema generation. Pass an explicit schemaAdapter."
        );
      }

      return schema["~standard"].jsonSchema.input({
        target: "draft-07",
      }) as JsonSchema;
    },

    async parse(schema, input) {
      const result = await schema["~standard"].validate(input);
      if (result.issues) {
        throw createValidationError(result.issues);
      }
      return result.value as InferSchemaOutput<S>;
    },
  };
}

export function zodAdapter<
  S extends StandardSchemaV1 = StandardSchemaV1,
>(): SchemaAdapter<S, InferSchemaOutput<S>> {
  return standardSchemaAdapter<S>();
}

export function jsonSchemaAdapter(): SchemaAdapter<JsonSchema, JsonSchema> {
  return {
    toJsonSchema: (schema) => schema,
    parse: (_schema, input) => input as JsonSchema,
  };
}

export function detectAdapter(schema: unknown): SchemaAdapter {
  if (isStandardSchema(schema)) return standardSchemaAdapter();
  if (isJsonSchema(schema)) return jsonSchemaAdapter();
  throw new Error(
    "[redop] Could not detect schema type. Pass a Standard Schema-compatible instance or a plain JSON Schema object."
  );
}
