import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { MCPToolDefinition } from '../types';
import { beepClient } from './beepSDKClient';

export interface CheckBeepApiResult {
  status: string;
  timestamp: string;
}

// Zod schema (no parameters needed)
export const checkBeepApiSchema = z.object({});

// Auto-generated TypeScript type
export type CheckBeepApiParams = z.infer<typeof checkBeepApiSchema>;

/**
 * Checks the status of the BEEP API using the SDK.
 * @returns The API status.
 */
export async function checkBeepApi(
  _params: CheckBeepApiParams,
): Promise<CheckBeepApiResult | { error: string }> {
  try {
    const status = await beepClient.healthCheck();

    return {
      status,
      timestamp: new Date().toISOString(),
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    console.error('Error checking BEEP API status:', errorMessage);
    return { error: `Failed to connect to BEEP API: ${errorMessage}` };
  }
}

/**
 * MCP Tool Definition with Zod schema
 */
export const checkBeepApiTool: MCPToolDefinition = {
  name: 'checkBeepApi',
  description: 'Check the status of the BEEP API using the SDK',
  inputSchema: zodToJsonSchema(checkBeepApiSchema),
  handler: checkBeepApi,
};
