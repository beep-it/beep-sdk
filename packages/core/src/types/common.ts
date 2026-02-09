/**
 * @fileoverview Common types and utilities used across the BEEP SDK
 */

/**
 * Represents a monetary amount as a decimal string
 * @example "10.50" represents $10.50
 * @example "0.99" represents $0.99
 */
export type MoneyAmount = string;

/**
 * UUID v4 string format
 * @pattern ^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$
 * @example "123e4567-e89b-12d3-a456-426614174000"
 */
export type UUID = string;

/**
 * ISO 8601 datetime string
 * @format date-time
 * @example "2023-12-25T10:30:00Z"
 */
export type ISODateTime = string;

/**
 * Blockchain transaction signature
 * @example "5J3mBbAH58CpQ3Y5RNJpUKPE62jPJzqiPbZ4FwFeMr4xdHkfqGoeKv"
 */
export type TransactionSignature = string;

/**
 * Blockchain wallet address
 * @example "0x742d35Cc6634C0532925a3b844Bc9e7595f56789"
 */
export type WalletAddress = string;

/**
 * Supported blockchain networks in BEEP
 */
export enum BlockchainNetwork {
  /** SUI blockchain network */
  SUI = 'SUI',
  /** Solana blockchain network */
  SOLANA = 'SOLANA',
}

/**
 * Common API response wrapper
 * @template T The type of data contained in the response
 */
export interface ApiResponse<T> {
  /** Indicates if the request was successful */
  success: boolean;
  /** Response data when successful */
  data?: T;
  /** Error message when unsuccessful */
  error?: string;
  /** Additional error details */
  details?: Record<string, unknown>;
  /** Request tracking ID for support */
  requestId?: string;
}

/**
 * Pagination parameters for list endpoints
 */
export interface PaginationParams {
  /** Maximum number of items to return (1-100) */
  limit?: number;
  /** Number of items to skip */
  offset?: number;
  /** Cursor for pagination */
  cursor?: string;
}

/**
 * Paginated response wrapper
 * @template T The type of items in the list
 */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  /** Total number of items available */
  total?: number;
  /** Pagination metadata */
  pagination?: {
    /** Current page number */
    page: number;
    /** Items per page */
    limit: number;
    /** Total number of pages */
    totalPages: number;
    /** Cursor for next page */
    nextCursor?: string;
    /** Cursor for previous page */
    prevCursor?: string;
  };
}

/**
 * Sort order for list endpoints
 */
export enum SortOrder {
  /** Ascending order (oldest/smallest first) */
  ASC = 'asc',
  /** Descending order (newest/largest first) */
  DESC = 'desc',
}

/**
 * Common sorting parameters
 */
export interface SortParams {
  /** Field to sort by */
  sortBy?: string;
  /** Sort order */
  sortOrder?: SortOrder;
}

/**
 * Date range filter
 */
export interface DateRangeFilter {
  /** Start date (inclusive) */
  from?: ISODateTime;
  /** End date (inclusive) */
  to?: ISODateTime;
}

/**
 * Status indicator for various entities
 */
export enum EntityStatus {
  /** Entity is active and operational */
  ACTIVE = 'active',
  /** Entity is temporarily disabled */
  INACTIVE = 'inactive',
  /** Entity is pending activation */
  PENDING = 'pending',
  /** Entity has been deleted */
  DELETED = 'deleted',
  /** Entity is archived */
  ARCHIVED = 'archived',
}

/**
 * Generic filter parameters for list endpoints
 */
export interface FilterParams extends PaginationParams, SortParams {
  /** Filter by status */
  status?: EntityStatus | EntityStatus[];
  /** Date range filter */
  dateRange?: DateRangeFilter;
  /** Search query */
  search?: string;
  /** Additional custom filters */
  filters?: Record<string, unknown>;
}

/**
 * Webhook event types
 */
export enum WebhookEventType {
  /** Payment completed successfully */
  PAYMENT_COMPLETED = 'payment.completed',
  /** Payment failed */
  PAYMENT_FAILED = 'payment.failed',
  /** Invoice paid */
  INVOICE_PAID = 'invoice.paid',
  /** Invoice expired */
  INVOICE_EXPIRED = 'invoice.expired',
  /** Product created */
  PRODUCT_CREATED = 'product.created',
  /** Product updated */
  PRODUCT_UPDATED = 'product.updated',
  /** Subscription activated */
  SUBSCRIPTION_ACTIVATED = 'subscription.activated',
  /** Subscription cancelled */
  SUBSCRIPTION_CANCELLED = 'subscription.cancelled',
}

/**
 * Webhook payload structure
 * @template T The type of data in the webhook
 */
export interface WebhookPayload<T> {
  /** Unique event ID */
  id: UUID;
  /** Event type */
  type: WebhookEventType;
  /** Timestamp of the event */
  timestamp: ISODateTime;
  /** Event data */
  data: T;
  /** HMAC signature for verification */
  signature: string;
}

/**
 * Type guard to check if a value is a valid UUID
 */
export function isUUID(value: unknown): value is UUID {
  if (typeof value !== 'string') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

/**
 * Type guard to check if a value is a valid money amount
 */
export function isMoneyAmount(value: unknown): value is MoneyAmount {
  if (typeof value !== 'string') return false;
  const moneyRegex = /^\d+(\.\d{1,2})?$/;
  return moneyRegex.test(value);
}

/**
 * Format a number as a money amount string
 */
export function formatMoneyAmount(amount: number, decimals: number = 2): MoneyAmount {
  return amount.toFixed(decimals);
}

/**
 * Parse a money amount string to number
 */
export function parseMoneyAmount(amount: MoneyAmount): number {
  return parseFloat(amount);
}
