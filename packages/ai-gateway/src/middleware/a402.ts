import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import {
  ChatCompletionRequest,
  GatewayConfig,
  PaymentReceipt,
} from '../types';
import { LLMRouter } from '../router';
import {
  generatePaymentRequest,
  getSession,
  creditSession,
  createSession,
  hassufficientBalance,
} from '../settlement/preauth';

/**
 * a402 payment gate middleware for the AI gateway.
 *
 * Flow:
 * 1. Check for Payment-Receipt header → verify on-chain, credit session
 * 2. Check for existing session with sufficient balance → allow through
 * 3. Otherwise → return 402 with Payment-Request
 */
export function createA402Middleware(config: GatewayConfig, router: LLMRouter) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const body = req.body as ChatCompletionRequest;

    // Resolve the model
    const model = router.getModel(body.model);
    if (!model) {
      res.status(400).json({
        error: {
          message: `Model '${body.model}' not found. Use GET /v1/models to list available models.`,
          type: 'invalid_request_error',
          code: 'model_not_found',
        },
      });
      return;
    }

    // Store resolved model on request for downstream use
    (req as any).resolvedModel = model;

    // Check for Payment-Receipt header
    const receiptHeader = req.headers['payment-receipt'] as string | undefined;
    if (receiptHeader) {
      try {
        const receipt: PaymentReceipt = JSON.parse(receiptHeader);

        // Verify the payment on-chain via Beep API
        const verified = await verifyPayment(receipt, config);
        if (verified) {
          // Credit the session
          const amount = verified.amount;
          let session = getSession(receipt.sessionId);
          if (!session) {
            session = createSession();
          }
          creditSession(session.id, amount);
          (req as any).sessionId = session.id;
          next();
          return;
        }
      } catch (err) {
        // Invalid receipt format, fall through to 402
      }
    }

    // Check for existing session via header or query param
    const sessionId =
      (req.headers['x-session-id'] as string) ||
      (req.query.session_id as string);

    if (sessionId) {
      const session = getSession(sessionId);
      if (session && hassufficientBalance(sessionId, body, model, config.costMultiplier)) {
        (req as any).sessionId = sessionId;
        next();
        return;
      }
    }

    // No valid payment or session — return 402 Payment Required
    const paymentRequest = generatePaymentRequest(body, model, config);

    res.status(402).json({
      error: {
        message: 'Payment required. Complete payment and retry with Payment-Receipt header.',
        type: 'payment_required',
        code: 'a402_payment_required',
      },
      payment_request: paymentRequest,
    });
  };
}

/**
 * Verify a payment receipt on-chain via the Beep API.
 * Returns the verified amount or null if invalid.
 */
async function verifyPayment(
  receipt: PaymentReceipt,
  config: GatewayConfig,
): Promise<{ amount: number; verified: boolean } | null> {
  try {
    const response = await axios.post(
      `${config.beepServerUrl}/v1/payment/verify`,
      {
        txDigest: receipt.txDigest,
        chain: 'SUI',
        expectedRecipient: config.recipientAddress,
      },
      {
        headers: {
          Authorization: `Bearer ${config.beepApiKey}`,
          'Content-Type': 'application/json',
        },
      },
    );

    if (response.data?.verified) {
      return {
        amount: parseFloat(response.data.amount),
        verified: true,
      };
    }

    return null;
  } catch {
    return null;
  }
}
