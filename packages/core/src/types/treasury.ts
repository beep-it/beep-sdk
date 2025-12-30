/**
 * Treasury module type definitions for the BEEP SDK
 */

export interface TreasuryInfo {
  /** Total balance across all treasury accounts in USD */
  totalBalanceUSD: string;
  /** Array of treasury accounts for different chains/tokens */
  accounts: TreasuryAccount[];
  /** Total yield earned across all accounts */
  totalYieldEarned: string;
  /** Current overall APY across all allocations */
  currentAPY: string;
  /** Total beeper points */
  totalPoints: number;
}

export interface TreasuryAccount {
  /** Unique account ID */
  id: string;
  /** Blockchain chain */
  chain: ChainType;
  /** Token type */
  token: TokenType;
  /** Total amount in the account */
  totalAmount: string;
  /** Amount currently allocated to yield generators */
  allocatedAmount: string;
  /** Amount not allocated (liquid) */
  unallocatedAmount: string;
  /** Current value of allocated funds including yield */
  allocatedAmountWithYield: string;
}

export interface YieldHistory {
  /** Start date of the range */
  startDate: string;
  /** End date of the range */
  endDate: string;
  /** Total yield earned in the period */
  totalYield: string;
  /** Array of daily yield snapshots */
  snapshots: YieldSnapshot[];
}

export interface YieldSnapshot {
  /** Snapshot date */
  date: string;
  /** Balance at snapshot time */
  balance: string;
  /** Yield earned at snapshot time */
  yieldEarned: string;
  /** APY at snapshot time */
  apy: string;
}

export interface Transaction {
  /** Transaction ID */
  id: string;
  /** Transaction type */
  type: 'deposit' | 'withdrawal' | 'allocation' | 'deallocation';
  /** Transaction amount */
  amount: string;
  /** Blockchain chain */
  chain: ChainType;
  /** Token type */
  token: TokenType;
  /** Transaction status */
  status: string;
  /** Transaction timestamp */
  timestamp: string;
  /** Blockchain transaction hash (if available) */
  txHash?: string;
}

export interface TransactionList {
  /** Array of transactions */
  transactions: Transaction[];
  /** Total number of transactions */
  total: number;
  /** Limit used for pagination */
  limit: number;
  /** Offset used for pagination */
  offset: number;
}

export interface AllocationInfo {
  /** Yield generator name */
  yieldGenerator: string;
  /** Protocol name (e.g., "Aave", "Compound") */
  protocol: string;
  /** Blockchain chain */
  chain: ChainType;
  /** Token type */
  token: TokenType;
  /** Amount allocated to this generator */
  allocatedAmount: string;
  /** Current value including yield */
  currentValue: string;
  /** Yield earned from this allocation */
  yieldEarned: string;
  /** Current APY for this allocation */
  apy: string;
}

export interface WithdrawalRequest {
  /** Withdrawal request ID */
  id: string;
  /** Withdrawal amount */
  amount: string;
  /** Blockchain chain */
  chain: ChainType;
  /** Token type */
  token: TokenType;
  /** Destination wallet address */
  destinationAddress?: string;
  /** Request status */
  status: WithdrawalStatus;
  /** Whether approval is required */
  approvalRequired: boolean;
  /** Approval tier if approval required */
  approvalTier?: ApprovalTier;
  /** Approval status details */
  approvalStatus?: {
    currentApprovals: number;
    requiredApprovals: number;
    approvers: string[];
  };
  /** Whether 2FA was verified */
  twoFactorVerified: boolean;
  /** Whether email was confirmed */
  emailConfirmed: boolean;
  /** Request creation timestamp */
  createdAt: string;
  /** Estimated completion time */
  estimatedCompletion?: string;
  /** Blockchain transaction hash (when completed) */
  txHash?: string;
}

export type WithdrawalStatus =
  | 'REQUESTED'
  | 'IN_PROGRESS'
  | 'RESERVED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'FAILED';

export type ApprovalTier = 'SMALL' | 'MEDIUM' | 'LARGE';

export interface WithdrawalLimits {
  /** Daily limit in USD */
  dailyLimitUSD: string;
  /** Per-transaction limit in USD */
  perTransactionLimitUSD: string;
  /** Current daily usage in USD */
  currentDailyUsageUSD: string;
  /** Remaining daily limit in USD */
  remainingDailyLimitUSD: string;
  /** Last reset timestamp */
  lastResetAt: string;
}

export interface IPWhitelistEntry {
  /** Whitelist entry ID */
  id: string;
  /** IP address or CIDR range */
  ipAddress: string;
  /** Optional label for the IP */
  label?: string;
  /** Whether the entry is active */
  isActive: boolean;
  /** Entry creation timestamp */
  createdAt: string;
}

export interface TreasuryWebhook {
  /** Webhook ID */
  id: string;
  /** Webhook URL (HTTPS only) */
  url: string;
  /** HMAC secret for signature verification */
  secret?: string;
  /** Array of event types to subscribe to */
  events: TreasuryEventType[];
  /** Whether the webhook is active */
  isActive: boolean;
  /** Consecutive failure count */
  failureCount: number;
  /** Last successful delivery timestamp */
  lastDeliveryAt?: string;
  /** Webhook creation timestamp */
  createdAt: string;
}

export type TreasuryEventType =
  | 'treasury.deposit'
  | 'treasury.withdrawal.requested'
  | 'treasury.withdrawal.approved'
  | 'treasury.withdrawal.completed'
  | 'treasury.withdrawal.failed'
  | 'treasury.balance.changed'
  | 'treasury.yield.earned';

export interface WebhookDelivery {
  /** Delivery attempt ID */
  id: string;
  /** Event type delivered */
  eventType: TreasuryEventType;
  /** Event payload */
  payload: any;
  /** HTTP response status code */
  responseStatus?: number;
  /** Number of delivery attempts */
  attempts: number;
  /** Successful delivery timestamp */
  deliveredAt?: string;
  /** Failed delivery timestamp */
  failedAt?: string;
  /** Delivery creation timestamp */
  createdAt: string;
}

export interface WebhookDeliveryStats {
  /** Total deliveries */
  total: number;
  /** Successful deliveries */
  successful: number;
  /** Failed deliveries */
  failed: number;
  /** Pending deliveries */
  pending: number;
}

// Supported chain and token types (should match backend)
export type ChainType = 'SOLANA' | 'ETHEREUM' | 'SUI' | 'POLYGON';
export type TokenType = 'USDT' | 'USDC' | 'SOL' | 'ETH' | 'SUI' | 'MATIC';

// Request/Response payloads
export interface CreateWithdrawalPayload {
  /** Withdrawal amount */
  amount: string;
  /** Withdrawal amount in USD (optional, defaults to amount) */
  amountUSD?: string;
  /** Blockchain chain */
  chain: ChainType;
  /** Token type */
  token: TokenType;
  /** Destination wallet address */
  destinationAddress: string;
  /** 2FA code */
  twoFactorCode: string;
}

export interface CreateWithdrawalResponse {
  /** Created withdrawal request ID */
  withdrawalRequestId: string;
  /** Request status */
  status: WithdrawalStatus;
  /** Withdrawal amount */
  amount: string;
  /** Approval tier */
  tier: ApprovalTier;
  /** Whether approval is required */
  approvalRequired: boolean;
  /** Approval ID if approval required */
  approvalId?: string;
  /** Estimated completion message */
  estimatedCompletion: string;
}

export interface UpdateLimitsPayload {
  /** New daily limit in USD (optional) */
  dailyLimitUSD?: string;
  /** New per-transaction limit in USD (optional) */
  perTransactionLimitUSD?: string;
}

export interface AddIPWhitelistPayload {
  /** IP address or CIDR range */
  ipAddress: string;
  /** Optional label */
  label?: string;
}

export interface CreateWebhookPayload {
  /** HTTPS webhook URL */
  url: string;
  /** Event types to subscribe to */
  events: TreasuryEventType[];
  /** Optional HMAC secret (auto-generated if not provided) */
  secret?: string;
}

export interface UpdateWebhookPayload {
  /** New webhook URL (optional) */
  url?: string;
  /** New event types (optional) */
  events?: TreasuryEventType[];
  /** Enable/disable webhook (optional) */
  isActive?: boolean;
}

export interface TransactionQueryParams {
  /** Max number of transactions to return */
  limit?: number;
  /** Number of transactions to skip */
  offset?: number;
  /** Filter by transaction type */
  type?: Transaction['type'];
}
