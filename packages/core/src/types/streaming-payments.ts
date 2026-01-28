/**
 * @fileoverview Streaming payment types for pay-as-you-go services
 * @module streaming-payments
 */

import { UUID, MoneyAmount, ISODateTime } from './common';

/**
 * Start streaming payment parameters
 * @description Begins charging for a streaming session
 * @example
 * ```typescript
 * await beep.payments.startStreaming({
 *   apiKey: 'your_api_key',
 *   invoiceId: 'invoice-uuid-from-issue-payment'
 * });
 * ```
 */
export interface StartStreamingPayload {
  /** API key for authentication */
  apiKey: string;

  /** Invoice ID from issuePayment response */
  invoiceId: UUID;

  /**
   * Optional billing interval override (seconds)
   * @default 60
   * @min 10
   * @max 3600
   */
  billingIntervalSeconds?: number;
}

/**
 * Start streaming response
 */
export interface StartStreamingResponse {
  /** Indicates if streaming started successfully */
  success: boolean;

  /** Streaming session details */
  session: {
    /** Current session status */
    status: 'streaming';
    /** Timestamp when streaming started */
    startedAt: ISODateTime;
    /** Current billing rate per interval */
    billingRate: MoneyAmount;
    /** Next charge timestamp */
    nextChargeAt: ISODateTime;
  };

  /** Any warnings about the session */
  warnings?: string[];
}

/**
 * Pause streaming payment parameters
 * @description Temporarily stops charging without ending the session
 */
export interface PauseStreamingPayload {
  /** API key for authentication */
  apiKey: string;

  /** Invoice ID of the streaming session */
  invoiceId: UUID;

  /** Reason for pausing (for audit trail) */
  reason?: string;
}

/**
 * Pause streaming response
 */
export interface PauseStreamingResponse {
  /** Indicates if pause was successful */
  success: boolean;

  /** Updated session information */
  session: {
    /** Current session status */
    status: 'paused';
    /** When the session was paused */
    pausedAt: ISODateTime;
    /** Total charged so far */
    totalCharged: MoneyAmount;
    /** Total duration streamed (seconds) */
    totalDurationSeconds: number;
  };
}

/**
 * Stop streaming payment parameters
 * @description Permanently ends the streaming session and finalizes charges
 */
export interface StopStreamingPayload {
  /** API key for authentication */
  apiKey: string;

  /** Invoice ID of the streaming session */
  invoiceId: UUID;

  /**
   * Force stop even if there are pending charges
   * @default false
   */
  force?: boolean;

  /** Reason for stopping (for audit trail) */
  reason?: string;
}

/**
 * Stop streaming final response
 */
export interface StopStreamingResponse {
  /** Indicates if stop was successful */
  success: boolean;

  /** Final session summary */
  summary: {
    /** Final session status */
    status: 'completed' | 'cancelled';
    /** Session start time */
    startedAt: ISODateTime;
    /** Session end time */
    endedAt: ISODateTime;
    /** Total duration in seconds */
    totalDurationSeconds: number;
    /** Final amount charged */
    totalCharged: MoneyAmount;
    /** Number of billing intervals */
    billingIntervals: number;
    /** Assets consumed during session */
    assetsConsumed: Array<{
      /** Asset ID */
      assetId: UUID;
      /** Asset name */
      name: string;
      /** Quantity consumed */
      quantityConsumed: number;
      /** Total cost for this asset */
      totalCost: MoneyAmount;
    }>;
  };

  /** Final invoice details */
  invoice: {
    /** Invoice ID */
    id: UUID;
    /** Invoice status */
    status: 'paid' | 'pending' | 'failed';
    /** Payment transaction ID if paid */
    transactionId?: string;
  };
}

/**
 * Streaming session status
 */
export interface StreamingSessionStatus {
  /** Session ID */
  sessionId: UUID;
  /** Invoice ID */
  invoiceId: UUID;
  /** Current status */
  status: 'active' | 'paused' | 'stopped' | 'expired';
  /** Session creation time */
  createdAt: ISODateTime;
  /** Last activity time */
  lastActivityAt: ISODateTime;
  /** Current charges */
  currentCharges: MoneyAmount;
  /** Estimated remaining time based on balance */
  estimatedRemainingMinutes?: number;
}

/**
 * Get streaming session status parameters
 */
export interface GetStreamingStatusPayload {
  /** API key for authentication */
  apiKey: string;
  /** Invoice ID to check */
  invoiceId: UUID;
}

/**
 * Type guards for streaming responses
 */
export function isStreamingActive(status: StreamingSessionStatus): boolean {
  return status.status === 'active';
}

export function isStreamingPaused(status: StreamingSessionStatus): boolean {
  return status.status === 'paused';
}

export function isStreamingEnded(status: StreamingSessionStatus): boolean {
  return status.status === 'stopped' || status.status === 'expired';
}
