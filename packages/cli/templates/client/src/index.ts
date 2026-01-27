import { config } from './config';
import { mcpClient } from './mcp-client';
import { listSellerTools, checkBeepApiTool } from './tools';

/**
 * Minimal MCP buying agent starter
 *
 * What this does:
 * - Reads SERVER_URL and COMMUNICATION_MODE from `.env`
 * - Connects to the SELLER MCP server (no auto-discovery)
 * - Lists available tools so you can see what the seller exposes
 * - Optionally calls a simple demo tool if present
 *
 * How to point at a specific seller (e.g., companyA):
 * - Set SERVER_URL to their MCP endpoint, e.g.:
 *     SERVER_URL=https://companyA.example.com/mcp
 * - Keep COMMUNICATION_MODE=https (default) for hosted sellers
 * - For local testing of a seller process you run directly, set COMMUNICATION_MODE=stdio
 */

async function runExample() {
  // Connect to the remote MCP server (HTTP transport by default)
  const url = new URL(config.serverUrl);
  await mcpClient.initialize({ type: 'http', url });

  // Discovery: list tools from the seller's MCP server
  const _tools = await listSellerTools(mcpClient);

  // Respect DEFAULT_LIST_ONLY to stop after discovery
  if (process.env.DEFAULT_LIST_ONLY === 'true') return;

  // Example: attempt to call a known simple tool if present
  try {
    const result = await (checkBeepApiTool.handler as any)({}, mcpClient);
    if (result) console.log('checkBeepApi result:', result);
  } catch (_) {
    // ignore if not present
  }
}

runExample().catch((e) => {
  console.error('Client error:', e);
  process.exit(1);
});
