import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import 'dotenv/config';

// Import tool definitions (not just handlers)
import { checkBeepApiTool } from './tools/checkBeepApi';
import { getAvailableWalletsTool } from './tools/getAvailableWallets';
import { requestAndPurchaseAssetTool } from './tools/requestAndPurchaseAsset';
import { signSolanaTransactionTool } from './tools/signSolanaTransaction';
import { issuePaymentTool } from './tools/issuePayment';
import { pauseStreamingTool } from './tools/pauseStreaming';
import { startStreamingTool } from './tools/startStreaming';
import { stopStreamingTool } from './tools/stopStreaming';

/**
 * MCP Tool Definition with Zod schema support
 */
export interface MCPToolDefinition {
  name: string;
  description: string;
  inputSchema: any; // JSON Schema object (converted from Zod)
  handler: (params: any) => Promise<any>;
}

/**
 * Registry of all MCP tools with their schemas
 */
export interface MCPToolRegistry {
  [key: string]: MCPToolDefinition;
}

/**
 * MCP tool registry - tools are imported from individual files
 * Each tool file exports its own schema and handler
 */
const tools: MCPToolRegistry = {
  checkBeepApi: checkBeepApiTool,
  requestAndPurchaseAsset: requestAndPurchaseAssetTool,
  signSolanaTransaction: signSolanaTransactionTool,
  getAvailableWallets: getAvailableWalletsTool,
  issuePayment: issuePaymentTool,
  pauseStreaming: pauseStreamingTool,
  startStreaming: startStreamingTool,
  stopStreaming: stopStreamingTool,
};

/**
 * Create and configure the MCP server
 */
function createMCPServer(): Server {
  const server = new Server(
    {
      // NOTE: You will need to update the name and version of the server
      name: 'mcp-server',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  // Register list_tools handler
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: Object.values(tools).map((tool) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
      })),
    };
  });

  // Register call_tool handler with dynamic tool execution
  server.setRequestHandler(CallToolRequestSchema, async (request: any) => {
    const { name, arguments: args } = request.params;

    const tool = tools[name];
    if (!tool) {
      throw new Error(`Tool ${name} not found`);
    }

    try {
      const result = await tool.handler(args || {});
      return { content: [{ type: 'text', text: JSON.stringify(result) }] };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Tool ${name} failed: ${errorMessage}`);
    }
  });

  return server;
}

/**
 * Start the MCP server
 */
async function main() {
  const server = createMCPServer();
  const transport = new StdioServerTransport();

  await server.connect(transport);
  console.error('BEEP MCP Server running on stdio');
}

// Start the server
main().catch((error) => {
  console.error('Server failed to start:', error);
  process.exit(1);
});
