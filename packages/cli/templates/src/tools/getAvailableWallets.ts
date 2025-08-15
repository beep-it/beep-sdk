import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { MCPToolDefinition } from '../mcp-server';

// Zod schema for getting available wallets
export const getAvailableWalletsSchema = z.object({});

// Auto-generated TypeScript type
export type GetAvailableWalletsParams = z.infer<typeof getAvailableWalletsSchema>;

/**
 * Skeleton: getAvailableWallets
 *
 * Returns a mock list of wallets. Replace with SDK lookup by API key.
 */
export async function getAvailableWallets(params: GetAvailableWalletsParams): Promise<any> {
  const wallets = [
    { id: 1, name: 'Primary Wallet' },
    { id: 2, name: 'Secondary Wallet' },
  ];
  return { content: [{ type: 'text', text: JSON.stringify(wallets, null, 2) }] };
}

/**
 * MCP Tool Definition with Zod schema
 */
export const getAvailableWalletsTool: MCPToolDefinition = {
  name: 'getAvailableWallets',
  description: 'Get available wallets for the current user',
  inputSchema: zodToJsonSchema(getAvailableWalletsSchema),
  handler: getAvailableWallets,
};
