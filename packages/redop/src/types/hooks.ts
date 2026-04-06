import type { Context, ToolRequest } from "./context";

export interface BeforeHookEvent<
  V extends Record<string, unknown> = {},
  I = unknown,
> {
  ctx: Context<V>;
  input: I;
  request: ToolRequest;
  tool: string;
}

export interface AfterHookEvent<
  V extends Record<string, unknown> = {},
  R = unknown,
  I = unknown,
> {
  ctx: Context<V>;
  input: I;
  request: ToolRequest;
  result: R;
  tool: string;
}

export interface AfterResponseHookEvent<
  V extends Record<string, unknown> = {},
  R = unknown,
  I = unknown,
> {
  ctx: Context<V>;
  error?: unknown;
  input: I;
  kind: "prompt" | "resource" | "tool";
  name: string;
  request: ToolRequest;
  result?: R;
  tool: string;
}

export interface ErrorHookEvent<
  V extends Record<string, unknown> = {},
  I = unknown,
> {
  ctx: Context<V>;
  error: unknown;
  input: I;
  request: ToolRequest;
  tool: string;
}

export interface TransformHookEvent<V extends Record<string, unknown> = {}> {
  ctx: Context<V>;
  params: Record<string, unknown>;
  request: ToolRequest;
  tool: string;
}

export interface ParseHookEvent<V extends Record<string, unknown> = {}> {
  ctx: Context<V>;
  input: unknown;
  request: ToolRequest;
  tool: string;
}

export type BeforeHook<V extends Record<string, unknown> = {}> = (
  e: BeforeHookEvent<V>
) => void | Promise<void>;
export type AfterHook<V extends Record<string, unknown> = {}, R = unknown> = (
  e: AfterHookEvent<V, R>
) => R | void | Promise<R | void>;
export type AfterResponseHook<
  V extends Record<string, unknown> = {},
  R = unknown,
> = (e: AfterResponseHookEvent<V, R>
) => void | Promise<void>;
export type ErrorHook<V extends Record<string, unknown> = {}> = (
  e: ErrorHookEvent<V>
) => void | Promise<void>;
export type TransformHook<V extends Record<string, unknown> = {}> = (
  e: TransformHookEvent<V>
) => void | Record<string, unknown> | Promise<void | Record<string, unknown>>;
export type ParseHook<V extends Record<string, unknown> = {}> = (
  e: ParseHookEvent<V>
) => unknown | Promise<unknown>;
