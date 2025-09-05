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
