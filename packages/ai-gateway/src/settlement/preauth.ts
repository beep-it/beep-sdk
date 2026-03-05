import { v4 as uuid } from 'uuid';
import {
  ChatCompletionRequest,
  GatewayConfig,
  ModelDefinition,
  PaymentRequest,
  Session,
} from '../types';
import {
  estimateInputTokens,
  estimateCost,
  estimateMaxOutput,
  formatUsdcAmount,
} from '../router/cost';

/** In-memory session store (replace with Redis/SQLite for production) */
const sessions: Map<string, Session> = new Map();

export function getSession(sessionId: string): Session | undefined {
  return sessions.get(sessionId);
}

export function getAllSessions(): Session[] {
  return Array.from(sessions.values());
}

export function createSession(walletAddress?: string): Session {
  const session: Session = {
    id: `sess_${uuid()}`,
    walletAddress,
    balance: 0,
    totalPaid: 0,
    totalSpent: 0,
    requestCount: 0,
    createdAt: new Date(),
    lastActivityAt: new Date(),
  };
  sessions.set(session.id, session);
  return session;
}

export function creditSession(sessionId: string, amount: number): Session | undefined {
  const session = sessions.get(sessionId);
  if (!session) return undefined;
  session.balance += amount;
  session.totalPaid += amount;
  session.lastActivityAt = new Date();
  return session;
}

export function debitSession(sessionId: string, amount: number): Session | undefined {
  const session = sessions.get(sessionId);
  if (!session) return undefined;
  session.balance -= amount;
  session.totalSpent += amount;
  session.requestCount++;
  session.lastActivityAt = new Date();
  return session;
}

/**
 * Generate a Payment-Request for a chat completion.
 * Estimates cost based on input tokens + estimated max output.
 */
export function generatePaymentRequest(
  request: ChatCompletionRequest,
  model: ModelDefinition,
  config: GatewayConfig,
): PaymentRequest {
  const inputTokens = estimateInputTokens(request.messages);
  const outputTokens = estimateMaxOutput(request.max_tokens, model.maxTokens);
  const estimatedCost = estimateCost(
    model,
    inputTokens,
    outputTokens,
    config.costMultiplier,
  );

  // Create a session for this payment request
  const session = createSession();

  return {
    amount: formatUsdcAmount(estimatedCost),
    token: 'USDC',
    chain: 'SUI',
    recipient: config.recipientAddress,
    resource: '/v1/chat/completions',
    estimatedTokens: {
      input: inputTokens,
      output: outputTokens,
    },
    pricePerToken: {
      input: (model.pricing.inputPerToken * (config.costMultiplier || 1)).toFixed(9),
      output: (model.pricing.outputPerToken * (config.costMultiplier || 1)).toFixed(9),
    },
    paymentUrl: `${config.beepServerUrl}/v1/payment/request-payment`,
    sessionId: session.id,
  };
}

/**
 * Check if a session has sufficient balance for an estimated request cost.
 */
export function hassufficientBalance(
  sessionId: string,
  request: ChatCompletionRequest,
  model: ModelDefinition,
  costMultiplier: number = 1.0,
): boolean {
  const session = sessions.get(sessionId);
  if (!session) return false;

  const inputTokens = estimateInputTokens(request.messages);
  const outputTokens = estimateMaxOutput(request.max_tokens, model.maxTokens);
  const estimatedCost = estimateCost(model, inputTokens, outputTokens, costMultiplier);

  return session.balance >= estimatedCost;
}
