import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { MCPErrorResponse, MCPResponse, MCPToolDefinition } from '../types';
import { beepClient } from './beepSDKClient';

/**
 * Skeleton: signSolanaTransaction
 *
 * Returns a mock token transaction signing result. Replace with SDK token tx handling.
 */

// Zod schema defines both validation and types
export const signSolanaTransactionSchema = z.object({
  senderAddress: z.string().describe('Solana address of the transaction sender'),
  recipientAddress: z.string().describe('Solana address of the transaction recipient'),
  tokenMintAddress: z.string().describe('SPL token mint address'),
  amount: z.number().positive().describe('Amount to transfer in base units'),
  decimals: z.number().int().min(0).max(18).describe('Number of decimal places for the token'),
});

// Auto-generated TypeScript type
export type SignSolanaTransactionParams = z.infer<typeof signSolanaTransactionSchema>;

export async function signSolanaTransaction(
  params: unknown,
): Promise<MCPResponse | MCPErrorResponse> {
  // Validate parameters with Zod schema
  const validatedParams = signSolanaTransactionSchema.parse(params);

  const transactionResult = await (beepClient.payments as any).signSolanaTransaction({
    senderAddress: validatedParams.senderAddress,
    recipientAddress: validatedParams.recipientAddress,
    tokenMintAddress: validatedParams.tokenMintAddress,
    amount: validatedParams.amount,
    decimals: validatedParams.decimals,
  });

  return { content: [{ type: 'text', text: JSON.stringify(transactionResult) }] };
}

/**
 * MCP Tool Definition with Zod schema
 */
export const signSolanaTransactionTool: MCPToolDefinition = {
  name: 'signSolanaTransaction',
  description: 'Sign a Solana blockchain transaction',
  inputSchema: zodToJsonSchema(signSolanaTransactionSchema),
  handler: signSolanaTransaction,
};
