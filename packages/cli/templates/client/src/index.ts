import { config } from './config';
import { mcpClient } from './mcp-client';
import { listSellerTools, checkBeepApiTool } from './tools';

/**
 * Minimal MCP buying agent example.
 * - Connects to a remote MCP server and lists available tools.
 * - Demonstrates how a buyer surfaces payment-required responses (no SDK polling here).
 *
 * NOTE: This is a template stub. Wire this into your MCP client transport.
 */

async function runExample() {
  // Connect to the remote MCP server (HTTP transport by default)
  const url = new URL(config.serverUrl);
  await mcpClient.initialize({ type: 'http', url });

  // Discovery: list tools from the seller's MCP server
  const tools = await listSellerTools(mcpClient);

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
