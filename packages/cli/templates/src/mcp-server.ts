import 'dotenv/config';
import * as http from 'http';
import { checkBeepApi, CheckBeepApiResult } from './tools/checkBeepApi';
import { getPaidResource } from './tools/getPaidResource';
import { payInvoice } from './tools/payInvoice';
import { executePreauthorizedTransfer } from './tools/executePreauthorizedTransfer';
import { getPaymentWidget } from './tools/getPaymentWidget';
import { initiateDeviceLogin } from './tools/initiateDeviceLogin';
import { createMerchantAccountFromSSO } from './tools/createMerchantAccountFromSSO';
import { signSolanaTransaction } from './tools/signSolanaTransaction';
import { getTransactionStatus } from './tools/getTransactionStatus';
import { signSolanaTokenTransaction } from './tools/signSolanaTokenTransaction';
import { getAvailableWallets } from './tools/getAvailableWallets';

/**
 * Type representing free-form tool parameters.
 */
export type ToolParams = Record<string, unknown>;

/**
 * Tool function interface for MCP tools.
 */
export type ToolFunction = (params: ToolParams) => Promise<CheckBeepApiResult | { error: string }>;

/**
 * Registry mapping tool names to tool implementations.
 */
export interface ToolRegistry {
  [key: string]: ToolFunction;
}

/**
 * Minimal tool registry.
 * Tool names mirror the production MCP server in `beep-server/src/mcp/server.ts`.
 * Implementations here are placeholders; real logic should come from the SDK.
 */
const tools: ToolRegistry = {
  // Health
  checkBeepApi,
  // Payments flow (HTTP 402 style)
  getPaidResource,
  payInvoice,
  executePreauthorizedTransfer,
  getPaymentWidget,
  // Auth / onboarding
  initiateDeviceLogin,
  createMerchantAccountFromSSO,
  // Transactions and wallet utilities
  signSolanaTransaction,
  signSolanaTokenTransaction,
  getTransactionStatus,
  getAvailableWallets,
};

/**
 * Resolve communication mode from environment.
 * Expected values: 'https' | 'stdio'.
 */
const communicationMode = process.env.COMMUNICATION_MODE;

/**
 * Starts a basic HTTPS-like HTTP server that exposes a simple POST /invoke endpoint.
 * This is a minimal reference implementation; production servers should handle:
 *  - Authentication
 *  - Request validation and schema
 *  - Streaming responses where applicable
 */
function startHttpServer() {
  console.log('Starting server in HTTPS mode...');
  const port = process.env.PORT || 8443;

  const server = http.createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/invoke') {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      req.on('end', async () => {
        try {
          const { toolName, params } = JSON.parse(body);
          const tool = tools[toolName as keyof typeof tools];

          if (tool) {
            const result = await tool(params as ToolParams);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ result }));
          } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Tool not found' }));
          }
        } catch (error) {
          console.error('Error processing request:', error);
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid JSON' }));
        }
      });
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not Found' }));
    }
  });

  server.listen(port, () => {
    console.log(`BEEP MCP Server listening on port ${port}`);
  });
}

/**
 * Starts a basic STDIO loop, reading JSON lines from stdin and writing results to stdout.
 * This is suitable for clients that communicate over stdio.
 */
function startStdioServer() {
  console.log('Starting server in STDIO mode...');
  process.stdin.on('data', async (data) => {
    try {
      const { toolName, params } = JSON.parse(data.toString());
      const tool = tools[toolName as keyof typeof tools];
      if (tool) {
        const result = await tool(params as ToolParams);
        process.stdout.write(JSON.stringify({ result }) + '\n');
      } else {
        process.stdout.write(JSON.stringify({ error: 'Tool not found' }) + '\n');
      }
    } catch (error) {
      console.error('Error processing stdio data:', error);
      process.stdout.write(JSON.stringify({ error: 'Invalid JSON' }) + '\n');
    }
  });
}

/**
 * Entry point: choose server mode based on COMMUNICATION_MODE.
 */
(function main() {
  if (communicationMode === 'https') {
    startHttpServer();
  } else if (communicationMode === 'stdio') {
    startStdioServer();
  } else {
    console.error("Invalid COMMUNICATION_MODE specified in .env file. Please use 'https' or 'stdio'.");
    process.exit(1);
  }
})();
