import type { Context, ToolRequest } from "./context";

export interface ToolHandlerEvent<
  I = unknown,
  V extends Record<string, unknown> = {},
> {
  ctx: Context<V>;
  emit: import("./context").ProgressEmitter;
  input: I;
  request: ToolRequest;
  signal: AbortSignal;
  tool: string;
}

export interface ToolBeforeHookEvent<
  I = unknown,
  V extends Record<string, unknown> = {},
> {
  ctx: Context<V>;
  input: I;
  request: ToolRequest;
  tool: string;
}

export interface ToolAfterHookEvent<
  I = unknown,
  R = unknown,
  V extends Record<string, unknown> = {},
> extends ToolBeforeHookEvent<I, V> {
  result: R;
}

export interface ToolAfterResponseHookEvent<
  I = unknown,
  R = unknown,
  V extends Record<string, unknown> = {},
> extends ToolBeforeHookEvent<I, V> {
  error?: unknown;
  result?: R;
}

export type ToolHandler<
  I = unknown,
  O = unknown,
  V extends Record<string, unknown> = {},
> = (
  event: ToolHandlerEvent<I, V>
) => O | Promise<O>;

export type ToolNext<R = unknown> = () => Promise<R>;

export interface MiddlewareEvent<
  I = unknown,
  V extends Record<string, unknown> = {},
  R = unknown,
> extends ToolHandlerEvent<I, V> {
  arguments?: Record<string, string>;
  kind: "prompt" | "resource" | "tool";
  name: string;
  next: ToolNext<R>;
  params?: Record<string, string>;
  prompt?: string;
  resource?: string;
  uri?: string;
}

export type Middleware<
  I = unknown,
  R = unknown,
  V extends Record<string, unknown> = {},
> = (event: MiddlewareEvent<I, V, R>) => R | Promise<R>;

export interface ToolMiddlewareEvent<
  I = unknown,
  V extends Record<string, unknown> = {},
  R = unknown,
> extends ToolHandlerEvent<I, V> {
  next: ToolNext<R>;
}

export type ToolMiddleware<
  I = unknown,
  R = unknown,
  V extends Record<string, unknown> = {},
> = (event: ToolMiddlewareEvent<I, V, R>) => R | Promise<R>;

export type ToolBeforeHook<
  I = unknown,
  V extends Record<string, unknown> = {},
> = (event: ToolBeforeHookEvent<I, V>
) => void | Promise<void>;

export type ToolAfterHook<
  I = unknown,
  R = unknown,
  V extends Record<string, unknown> = {},
> = (event: ToolAfterHookEvent<I, R, V>) => R | void | Promise<R | void>;
export type ToolAfterResponseHook<
  I = unknown,
  R = unknown,
  V extends Record<string, unknown> = {},
> = (event: ToolAfterResponseHookEvent<I, R, V>) => void | Promise<void>;

/**
 * Behavioral hints forwarded to MCP clients.
 *
 * These hints do not change Redop runtime behavior on their own. They help
 * clients and agents decide how cautious they should be before calling a tool.
 */
export interface ToolAnnotations {
  /**
   * Set to `true` when the tool may delete, overwrite, or otherwise cause
   * hard-to-undo changes.
   *
   * Example: deleting files, cancelling jobs, charging a card.
   */
  destructiveHint?: boolean;
  /**
   * Set to `true` when repeated calls with the same input should produce the
   * same effect without compounding side effects.
   *
   * Example: syncing a record to a target state, upserting a resource.
   */
  idempotentHint?: boolean;
  /**
   * Set to `true` when the tool depends on information outside the server's
   * local state or known dataset.
   *
   * Example: web search, external API lookups, querying a live SaaS account.
   */
  openWorldHint?: boolean;
  /**
   * Set to `true` when the tool only reads data and does not mutate state.
   *
   * Example: search, list, inspect, validate, preview.
   */
  readOnlyHint?: boolean;
  /** Optional UI-friendly label surfaced by some MCP clients. */
  title?: string;
}

export type IconMimeType =
  | "image/png"
  | "image/jpeg"
  | "image/jpg"
  | "image/svg+xml"
  | "image/webp"
  | (string & {});

export type IconSize = "any" | `${number}x${number}`;
export type IconTheme = "light" | "dark";

export interface ServerIcon {
  /**
   * MIME type for the icon asset.
   *
   * Common values follow the MCP icon guidance:
   * - `image/png`
   * - `image/jpeg`
   * - `image/jpg`
   * - `image/svg+xml`
   * - `image/webp`
   *
   * @example
   * "image/svg+xml"
   */
  mimeType?: IconMimeType;
  /**
   * Optional size hints.
   * Use `WIDTHxHEIGHT` for raster icons or `"any"` for scalable formats
   * such as SVG.
   *
   * @example
   * ["48x48", "96x96"]
   */
  sizes?: IconSize[];
  /**
   * Icon URI.
   * Usually an `https:` URL or `data:` URI.
   *
   * @example
   * "https://example.com/icon.svg"
   */
  src: string;
  /**
   * Optional theme hint for clients that support theme-specific icons.
   */
  theme?: IconTheme;
}
