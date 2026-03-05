import { ChatMessage, ModelDefinition, TokenUsage } from '../types';

/**
 * Estimate the number of input tokens from messages.
 * Uses a rough heuristic: ~4 characters per token (conservative).
 * For production accuracy, use tiktoken or provider-reported usage.
 */
export function estimateInputTokens(messages: ChatMessage[]): number {
  let charCount = 0;
  for (const msg of messages) {
    // Role overhead (~4 tokens per message for role/formatting)
    charCount += 16;
    if (msg.content) {
      charCount += msg.content.length;
    }
    if (msg.name) {
      charCount += msg.name.length;
    }
  }
  // ~4 chars per token is a conservative estimate
  return Math.ceil(charCount / 4);
}

/**
 * Estimate the cost of a request given estimated token counts.
 */
export function estimateCost(
  model: ModelDefinition,
  inputTokens: number,
  outputTokens: number,
  costMultiplier: number = 1.0,
): number {
  const inputCost = inputTokens * model.pricing.inputPerToken;
  const outputCost = outputTokens * model.pricing.outputPerToken;
  return (inputCost + outputCost) * costMultiplier;
}

/**
 * Calculate the actual cost from provider-reported usage.
 */
export function calculateActualCost(
  model: ModelDefinition,
  usage: TokenUsage,
  costMultiplier: number = 1.0,
): number {
  return estimateCost(model, usage.prompt_tokens, usage.completion_tokens, costMultiplier);
}

/**
 * Format a cost in USD as a USDC amount string with appropriate precision.
 */
export function formatUsdcAmount(usdAmount: number): string {
  // USDC has 6 decimals, so we round to 6 decimal places
  return usdAmount.toFixed(6);
}

/**
 * Estimate max output tokens for cost estimation.
 * Uses the lesser of requested max_tokens or model's max.
 */
export function estimateMaxOutput(
  requestedMaxTokens: number | undefined,
  modelMaxTokens: number,
): number {
  if (requestedMaxTokens && requestedMaxTokens > 0) {
    return Math.min(requestedMaxTokens, modelMaxTokens);
  }
  // Default: assume 1/4 of model max for estimation (conservative)
  return Math.min(Math.ceil(modelMaxTokens / 4), 4096);
}
