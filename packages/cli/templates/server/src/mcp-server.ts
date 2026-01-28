import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import {
  CallToolRequestSchema,
  isInitializeRequest,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import 'dotenv/config';
import { Request, Response } from 'express';

// Import tool definitions (not just handlers)
import { randomUUID } from 'crypto';
import { checkBeepApiTool } from './tools/checkBeepApi';
import { issuePaymentTool } from './tools/issuePayment';
import { checkPaymentStatusTool } from './tools/checkPaymentStatus';
import { pauseStreamingTool } from './tools/pauseStreaming';
import { requestAndPurchaseAssetTool } from './tools/requestAndPurchaseAsset';
import { startStreamingTool } from './tools/startStreaming';
import { stopStreamingTool } from './tools/stopStreaming';
import { McpHttpHandlerParams, McpServerError, MCPToolDefinition } from './types';

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
  issuePayment: issuePaymentTool,
  checkPaymentStatus: checkPaymentStatusTool,
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
      // TODO[BEEP-683] SST: Return proper JSONRPC error response.
      throw new Error(`Tool ${name} not found`);
    }

    try {
      const result = await tool.handler(args || {});
      console.log(`Tool called ${name}`);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Tool ${name} failed: ${errorMessage}`);
    }
  });

  return server;
}

const transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};

let mcpServer: any;

/**
 * Start the MCP server
 */
async function main() {
  const type = process.env.COMMUNICATION_MODE;
  mcpServer = createMCPServer();
  if (type === 'stdio') {
    const transport = new StdioServerTransport();
    await mcpServer.connect(transport);
  }
}

// Start the server
main().catch((error) => {
  console.error('Server failed to start:', error);
  process.exit(1);
});

export function createMcpHttpHandler({ logger }: McpHttpHandlerParams) {
  if (!mcpServer) {
    mcpServer = createMCPServer();
  }
  // This handler now assumes that initializeMcp() has been called and completed at startup.
  return async (req: Request, res: Response) => {
    if (!mcpServer) {
      console.error(
        'MCP server not initialized. Make sure to initialize before starting the server.',
      );
      res.status(503).json({
        jsonrpc: '2.0',
        error: { code: -32001, message: 'Service Unavailable: MCP server is not initialized.' },
        id: req.body?.id || null,
      });
      return;
    }
    try {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, mcp-session-id');
      res.header('Access-Control-Expose-Headers', 'mcp-session-id');

      if (req.method === 'OPTIONS') {
        return res.status(200).end();
      }

      if (req.method === 'HEAD') {
        logger?.debug('Received HEAD request to MCP endpoint');
        return res.status(200).end();
      }

      const sessionId = req.header('mcp-session-id');

      logger?.debug(`MCP ${req.method} request details:`, {
        method: req.body?.method,
        sessionId: sessionId || 'MISSING',
        requestBody: req.body ? JSON.stringify(req.body).substring(0, 200) : 'empty',
        userAgent: req.header('user-agent'),
      });

      if (
        req.method === 'POST' &&
        (!req.body || typeof req.body !== 'object' || !req.body.jsonrpc || !req.body.method)
      ) {
        logger?.error('Invalid JSON-RPC request structure for POST:', req.body);
        return res.status(400).json({
          jsonrpc: '2.0',
          error: { code: -32600, message: 'Invalid JSON-RPC request' },
          id: req.body?.id || null,
        });
      }

      // Handle session management
      try {
        if (sessionId && transports[sessionId]) {
          logger?.debug(`Using existing transport for session: ${sessionId}`);
          const transport = transports[sessionId];

          if (req.method === 'DELETE') {
            logger?.debug(`Client requested termination of session ${sessionId}`);
            await transport.close();
            delete transports[sessionId];
            return res.status(204).end();
          } else if (req.method === 'POST') {
            return await transport.handleRequest(req, res, req.body);
          } else if (req.method === 'GET') {
            return await transport.handleRequest(req, res);
          }
        } else if (req.method === 'POST' && isInitializeRequest(req.body) && !sessionId) {
          logger?.debug('Handling initialize request - creating new transport');

          const transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: () => randomUUID(),
            enableDnsRebindingProtection: false,
            allowedHosts: ['127.0.0.1', 'localhost'].concat(
              process.env.BASE_SERVER_URL ? [process.env.BASE_SERVER_URL] : [],
            ),
            onsessioninitialized: (newSessionId) => {
              logger?.debug(`New MCP session initialized: ${newSessionId}`);
              transports[newSessionId] = transport;
            },
          });

          transport.onclose = () => {
            if (transport.sessionId) {
              logger?.debug(`Transport closed, cleaning up session: ${transport.sessionId}`);
              delete transports[transport.sessionId];
            }
          };

          await mcpServer.connect(transport);

          return await transport.handleRequest(req, res, req.body);
        } else {
          logger?.warn('Request without valid session ID and not an initialize request');
          return res.status(400).json({
            jsonrpc: '2.0',
            error: { code: -32000, message: 'Bad Request: No valid session ID provided' },
            id: req.body?.id || null,
          });
        }
      } catch (transportError) {
        logger?.error(`Transport error for ${req.method} request:`, transportError);
        throw transportError; // Let the outer catch block handle this
      }
    } catch (error) {
      const err = error as any;
      logger?.error(
        `Error in MCP HTTP handler for session ${req.header('mcp-session-id') || 'unknown'}:`,
        err,
      );

      if (!res.headersSent) {
        const appError =
          error instanceof McpServerError ? error : new McpServerError('Internal server error');
        res.status(appError.statusCode).json({
          jsonrpc: '2.0',
          error: { code: appError.statusCode, message: appError.message },
          id: req.body?.id || null,
        });
      }
    }
  };
}
