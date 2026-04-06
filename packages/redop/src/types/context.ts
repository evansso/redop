import type { TransportKind } from "./protocol";

export interface ProgressEmitter {
  progress(value: number, total?: number, message?: string): void;
}

export interface ToolRequest {
  abortSignal?: AbortSignal;
  headers: Record<string, string>;
  ip?: string;
  method?: string;
  progressCallback?: (p: {
    message?: string;
    progress: number;
    total?: number;
  }) => void;
  raw?: Request;
  sessionId?: string;
  transport: TransportKind;
  url?: string;
}

export type RequestMeta = ToolRequest;

export type BaseRequestContext<
  T extends Record<string, unknown> = Record<string, unknown>,
> = {
  headers: Record<string, string>;
  rawParams: Record<string, unknown>;
  requestId: string;
  sessionId?: string;
  transport: TransportKind;
} & T;

export type Context<
  T extends Record<string, unknown> = Record<string, unknown>,
> = BaseRequestContext<T> & {
  tool: string;
};

export type ResourceContext<
  T extends Record<string, unknown> = Record<string, unknown>,
> = BaseRequestContext<T> & {
  resource: string;
};

export type PromptContext<
  T extends Record<string, unknown> = Record<string, unknown>,
> = BaseRequestContext<T> & {
  prompt: string;
};
