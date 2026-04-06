export interface JsonRpcRequest {
  id: string | number | null;
  jsonrpc: "2.0";
  method: string;
  params?: Record<string, unknown>;
}

export interface JsonRpcResponse {
  error?: { code: number; message: string; data?: unknown };
  id: string | number | null;
  jsonrpc: "2.0";
  result?: unknown;
}

export type TransportKind = "http" | "stdio";

export enum McpErrorCode {
  ParseError = -32_700,
  InvalidRequest = -32_600,
  MethodNotFound = -32_601,
  InvalidParams = -32_602,
  InternalError = -32_603,
}

export class McpError extends Error {
  constructor(
    public readonly code: McpErrorCode,
    message: string,
    public readonly data?: unknown
  ) {
    super(message);
    this.name = "McpError";
  }
}
