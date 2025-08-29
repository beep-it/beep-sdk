import { PromptMessage } from '@modelcontextprotocol/sdk/dist/cjs/types';

export interface MCPResponse {
  content: Array<{
    type: string;
    text: string;
  }>;
  isError?: boolean;
}

export interface MCPErrorResponse {
  error: string;
}

interface ILogger {
  debug: (message: string, obj?: any) => void;
  log: (message: string, obj?: any) => void;
  error: (message: string, obj?: any) => void;
  warn: (message: string, obj?: any) => void;
}

export interface McpHttpHandlerParams {
  logger: ILogger;
}

export interface McpServerResponse<T> extends PromptMessage {
  data?: T;
  isError?: boolean;
}

/**
 * Base error class, use this to throw errors in tools.
 */
export class McpServerError {
  constructor(
    public message: string,
    public statusCode: number = 500,
  ) {}
}
