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

export class McpServerError {
  constructor(
    public message: string,
    public statusCode: number = 500,
  ) {}
}
