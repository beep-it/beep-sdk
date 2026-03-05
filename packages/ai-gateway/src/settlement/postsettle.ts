import axios from 'axios';
import { GatewayConfig, ModelDefinition, TokenUsage } from '../types';
import { calculateActualCost } from '../router/cost';
import { debitSession, getSession, creditSession } from './preauth';

export interface SettlementResult {
  sessionId: string;
  estimatedCost: number;
  actualCost: number;
  refundAmount: number;
  remainingBalance: number;
}

/**
 * Settle the actual cost of a completed request.
 * Debits the actual cost from the session balance.
 * If the estimated pre-auth was higher, the difference stays as credit.
 */
export function settleRequest(
  sessionId: string,
  model: ModelDefinition,
  usage: TokenUsage,
  costMultiplier: number = 1.0,
): SettlementResult | null {
  const session = getSession(sessionId);
  if (!session) return null;

  const actualCost = calculateActualCost(model, usage, costMultiplier);

  // Debit the actual cost from the session
  debitSession(sessionId, actualCost);

  const updatedSession = getSession(sessionId);

  return {
    sessionId,
    estimatedCost: 0, // tracked by the pre-auth flow
    actualCost,
    refundAmount: 0, // refund stays as session balance credit
    remainingBalance: updatedSession?.balance || 0,
  };
}

/**
 * Report gateway usage to Beep server for points earning.
 * Fire-and-forget — does not block the inference response.
 * Only active when config.reportUsageForPoints is true.
 */
export function reportUsageForPoints(
  config: GatewayConfig,
  sessionId: string,
  model: ModelDefinition,
  usage: TokenUsage,
  actualCostUsdc: number,
): void {
  if (!config.reportUsageForPoints) return;

  const session = getSession(sessionId);
  if (!session?.walletAddress) return;

  const payload = {
    walletAddress: session.walletAddress,
    model: model.id,
    promptTokens: usage.prompt_tokens,
    completionTokens: usage.completion_tokens,
    costUsdc: actualCostUsdc.toFixed(6),
    sessionId,
  };

  // Fire-and-forget: POST to beep-server
  axios.post(
    `${config.beepServerUrl}/v1/rewards/gateway-usage`,
    payload,
    {
      headers: {
        'x-api-key': config.beepApiKey,
        'Content-Type': 'application/json',
      },
      timeout: 5000,
    },
  ).then((res) => {
    if (res.data?.data?.pointsGranted) {
      console.log(`[points] Granted ${res.data.data.pointsGranted} points to ${session.walletAddress}`);
    }
  }).catch((err) => {
    console.warn(`[points] Failed to report usage: ${err.message}`);
  });
}
