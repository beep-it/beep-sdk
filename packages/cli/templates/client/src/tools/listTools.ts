import type { McpClientInternal } from '../mcp-client';

export async function listSellerTools(client: McpClientInternal) {
  const tools = await client.listTools();
  const summary = tools.map(t => ({ name: t.name, description: t.description }));
  console.log('Discovered tools on seller MCP:', summary);
  return tools;
}

