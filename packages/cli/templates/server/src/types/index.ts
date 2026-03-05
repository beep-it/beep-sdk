import { z } from 'zod';
import { PromptMessageSchema } from '@modelcontextprotocol/sdk/types.js';
type PromptMessage = z.infer<typeof PromptMessageSchema>;

/**
 * Standard MCP (Model Context Protocol) response format.
 *
 * Used by all BEEP MCP tools to return structured data to AI agents.
 * The content array allows for rich, multi-part responses.
 */
export interface MCPResponse {
  /** Array of response content blocks */
  content: Array<{
    /** Content type - typically 'text' for MCP tools */
    type: string;
    /** The actual response text/data */
    text: string;
  }>;
  /** Optional flag to indicate this response represents an error state */
  isError?: boolean;
}

/**
 * Error response format for MCP tools.
 *
 * Used when operations fail and need to communicate the failure reason
 * to the calling AI agent in a structured way.
 */
export interface MCPErrorResponse {
  /** Human-readable error description */
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

/**
 * MCP Tool Definition with Zod schema support
 */
export interface MCPToolDefinition {
  name: string;
  description: string;
  inputSchema: any; // JSON Schema object (converted from Zod)
  handler: (params: any) => Promise<any>;
}
