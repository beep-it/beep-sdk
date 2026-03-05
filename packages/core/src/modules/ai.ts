import { AxiosInstance } from 'axios';

/** Chat message in OpenAI-compatible format */
export interface AiChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/** Options for ai.chat() */
export interface AiChatOptions {
  model: string;
  messages: AiChatMessage[];
  gatewayUrl: string;
  max_tokens?: number;
  temperature?: number;
  stream?: boolean;
  /** Existing session ID to reuse balance */
  sessionId?: string;
}

/** Parsed Payment-Request from a 402 response */
interface PaymentRequestInfo {
  amount: string;
  token: string;
  chain: string;
  recipient: string;
  paymentUrl: string;
  sessionId: string;
}

/** Response from ai.chat() */
export interface AiChatResponse {
  id: string;
  model: string;
  content: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  sessionId: string;
  remainingBalance?: string;
}

/**
 * AI module for BeepClient — handles a402 payment negotiation
 * for AI inference gateway requests automatically.
 *
 * Usage:
 *   const beep = new BeepClient({ apiKey: '...', serverUrl: '...' });
 *   const response = await beep.ai.chat({
 *     model: 'claude-sonnet-4-20250514',
 *     messages: [{ role: 'user', content: 'Hello' }],
 *     gatewayUrl: 'https://ai.justbeep.it',
 *   });
 */
export class AiModule {
  private client: AxiosInstance;
  /** Cache session IDs per gateway URL */
  private sessionCache: Map<string, string> = new Map();

  constructor(client: AxiosInstance) {
    this.client = client;
  }

  /**
   * Send a chat completion request to a Beep AI Gateway.
   * Automatically handles the a402 payment flow:
   * 1. Sends request to gateway
   * 2. On 402 → parses Payment-Request
   * 3. Executes USDC payment via Beep
   * 4. Retries with Payment-Receipt
   * 5. Returns the LLM response
   */
  async chat(options: AiChatOptions): Promise<AiChatResponse> {
    const { gatewayUrl, sessionId, ...requestBody } = options;

    // Use cached session if available
    const cachedSession = sessionId || this.sessionCache.get(gatewayUrl);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (cachedSession) {
      headers['X-Session-Id'] = cachedSession;
    }

    // Step 1: Try the request (may succeed if session has balance)
    try {
      const response = await this.client.post(`${gatewayUrl}/v1/chat/completions`, requestBody, {
        headers,
      });

      const newSessionId = response.headers['x-session-id'];
      if (newSessionId) {
        this.sessionCache.set(gatewayUrl, newSessionId);
      }

      return this.parseCompletionResponse(response.data, newSessionId);
    } catch (error: any) {
      if (error.response?.status !== 402) {
        throw error;
      }

      // Step 2: Parse the 402 Payment-Request
      const paymentRequest = error.response.data?.payment_request as PaymentRequestInfo;
      if (!paymentRequest) {
        throw new Error('Gateway returned 402 without a payment_request');
      }

      // Step 3: Execute payment via Beep
      const receipt = await this.executePayment(paymentRequest);

      // Step 4: Retry with Payment-Receipt
      headers['Payment-Receipt'] = JSON.stringify(receipt);
      headers['X-Session-Id'] = paymentRequest.sessionId;

      const retryResponse = await this.client.post(
        `${gatewayUrl}/v1/chat/completions`,
        requestBody,
        { headers },
      );

      const retrySessionId = retryResponse.headers['x-session-id'] || paymentRequest.sessionId;
      this.sessionCache.set(gatewayUrl, retrySessionId);

      return this.parseCompletionResponse(retryResponse.data, retrySessionId);
    }
  }

  /**
   * Execute a USDC payment via the Beep API to fulfill an a402 payment request.
   */
  private async executePayment(
    paymentRequest: PaymentRequestInfo,
  ): Promise<{ txDigest: string; sessionId: string }> {
    // Use the Beep payment API to transfer USDC
    const response = await this.client.post('/v1/payment/a402/pay', {
      amount: paymentRequest.amount,
      token: paymentRequest.token,
      chain: paymentRequest.chain,
      recipient: paymentRequest.recipient,
    });

    return {
      txDigest: response.data.txDigest,
      sessionId: paymentRequest.sessionId,
    };
  }

  private parseCompletionResponse(data: any, sessionId?: string): AiChatResponse {
    const choice = data.choices?.[0];
    return {
      id: data.id,
      model: data.model,
      content: choice?.message?.content || '',
      usage: data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
      sessionId: sessionId || '',
      remainingBalance: data.remaining_balance,
    };
  }

  /** Get the cached session ID for a gateway */
  getSessionId(gatewayUrl: string): string | undefined {
    return this.sessionCache.get(gatewayUrl);
  }

  /** Clear the cached session for a gateway */
  clearSession(gatewayUrl: string): void {
    this.sessionCache.delete(gatewayUrl);
  }
}
