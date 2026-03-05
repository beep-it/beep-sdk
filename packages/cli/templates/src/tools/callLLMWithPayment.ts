import { BeepClient } from '@beep/sdk-core';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { MCPToolDefinition } from '../mcp-server';
import { MCPErrorResponse, MCPResponse } from '../types';

// Zod schema for callLLMWithPayment
export const callLLMWithPaymentSchema = z.object({
  model: z
    .string()
    .describe('Model ID to use (e.g., "claude-sonnet-4-20250514", "gpt-4o")'),
  prompt: z.string().describe('The user prompt to send to the LLM'),
  systemPrompt: z
    .string()
    .optional()
    .describe('Optional system prompt for the LLM'),
  gatewayUrl: z
    .string()
    .optional()
    .describe('AI gateway URL (defaults to BEEP_AI_GATEWAY_URL env var or https://ai.justbeep.it)'),
  maxTokens: z
    .number()
    .optional()
    .describe('Maximum output tokens (default: 4096)'),
  temperature: z
    .number()
    .optional()
    .describe('Temperature for generation (0-2, default: 1)'),
  sessionId: z
    .string()
    .optional()
    .describe('Existing session ID to reuse balance from a previous payment'),
});

export type CallLLMWithPaymentParams = z.infer<typeof callLLMWithPaymentSchema>;

export async function callLLMWithPayment(
  params: CallLLMWithPaymentParams,
): Promise<MCPResponse | MCPErrorResponse> {
  const { model, prompt, systemPrompt, gatewayUrl, maxTokens, temperature, sessionId } = params;

  const apiKey = process.env.BEEP_API_KEY;
  if (!apiKey) {
    return { error: 'BEEP_API_KEY is not configured in the .env file.' };
  }

  const gateway =
    gatewayUrl || process.env.BEEP_AI_GATEWAY_URL || 'https://ai.justbeep.it';

  const client = new BeepClient({
    apiKey,
    serverUrl: process.env.BEEP_SERVER_URL,
  });

  try {
    const messages: Array<{ role: 'system' | 'user'; content: string }> = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    const response = await client.ai.chat({
      model,
      messages,
      gatewayUrl: gateway,
      max_tokens: maxTokens || 4096,
      temperature: temperature ?? 1,
      sessionId,
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              status: 'success',
              model: response.model,
              content: response.content,
              usage: response.usage,
              sessionId: response.sessionId,
              remainingBalance: response.remainingBalance,
              instructions:
                'You can pass the sessionId to future calls to reuse your payment balance.',
            },
            null,
            2,
          ),
        },
      ],
      isError: false,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { error: `Failed to call LLM via gateway: ${errorMessage}` };
  }
}

/**
 * MCP Tool Definition with Zod schema
 */
export const callLLMWithPaymentTool: MCPToolDefinition = {
  name: 'callLLMWithPayment',
  description:
    'Call an LLM model through the Beep AI Gateway with automatic a402 USDC payment on Sui. ' +
    'Handles payment negotiation transparently — the agent pays per-token in USDC.',
  inputSchema: zodToJsonSchema(callLLMWithPaymentSchema),
  handler: callLLMWithPayment,
};
