import 'dotenv/config';
import express from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { randomUUID } from 'crypto';

// Client-hosted tools (buyer capabilities)
import { checkBeepApiTool } from './tools/checkBeepApi';
import { getAvailableWalletsTool } from './tools/getAvailableWallets';
import { signSolanaTransactionTool } from './tools/signSolanaTransaction';

// Optional: internal client for connecting to a seller MCP if a local tool needs it
// import { mcpClient } from './mcp-client';

function registerTools(server: McpServer) {
  server.registerTool(
    checkBeepApiTool.name,
    { title: checkBeepApiTool.name, description: checkBeepApiTool.description, inputSchema: (checkBeepApiTool as any).inputSchema },
    async (input: any) => {
      // The client tool receives input from remote callers; it can call out to a seller as needed.
      return await (checkBeepApiTool as any).handler(input, null);
    },
  );

  server.registerTool(
    getAvailableWalletsTool.name,
    { title: getAvailableWalletsTool.name, description: getAvailableWalletsTool.description, inputSchema: (getAvailableWalletsTool as any).inputSchema },
    async (input: any) => {
      return await (getAvailableWalletsTool as any).handler(input, null);
    },
  );

  server.registerTool(
    signSolanaTransactionTool.name,
    { title: signSolanaTransactionTool.name, description: signSolanaTransactionTool.description, inputSchema: (signSolanaTransactionTool as any).inputSchema },
    async (input: any) => {
      return await (signSolanaTransactionTool as any).handler(input, null);
    },
  );
}

async function start() {
  const server = new McpServer({ name: 'beep-mcp-client', version: '1.0.0' });
  registerTools(server);

  const mode = process.env.COMMUNICATION_MODE || 'https';
  if (mode === 'stdio') {
    const transport = new StdioServerTransport();
    await (server as any).connect(transport);
    return;
  }

  const transports: Record<string, StreamableHTTPServerTransport> = {};
  const app = express();
  app.use(express.json());

  app.all('/mcp', async (req, res) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, mcp-session-id');
    res.header('Access-Control-Expose-Headers', 'mcp-session-id');
    if (req.method === 'OPTIONS') return res.status(200).end();

    const sessionId = req.header('mcp-session-id') || undefined;
    if (sessionId && transports[sessionId]) {
      const transport = transports[sessionId];
      if (req.method === 'DELETE') {
        await transport.close();
        delete transports[sessionId];
        return res.status(204).end();
      }
      return await transport.handleRequest(req as any, res as any, req.method === 'POST' ? (req as any).body : undefined);
    }

    if (req.method === 'POST' && isInitializeRequest((req as any).body) && !sessionId) {
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        enableDnsRebindingProtection: false,
        allowedHosts: ['127.0.0.1', 'localhost'],
        onsessioninitialized: (newId) => { transports[newId] = transport; },
      });
      transport.onclose = () => { if (transport.sessionId) delete transports[transport.sessionId]; };
      await (server as any).connect(transport);
      return await transport.handleRequest(req as any, res as any, (req as any).body);
    }

    return res.status(400).json({ jsonrpc: '2.0', error: { code: -32000, message: 'Bad Request' }, id: (req as any).body?.id || null });
  });

  const port = Number(process.env.PORT || 5081);
  app.listen(port, () => console.log(`Buyer MCP server listening on :${port}`));
}

start().catch((e) => { console.error(e); process.exit(1); });

