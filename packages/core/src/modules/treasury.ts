import { AxiosInstance } from 'axios';
import type {
  TreasuryInfo,
  YieldHistory,
  TransactionList,
  TransactionQueryParams,
  AllocationInfo,
  WithdrawalRequest,
  WithdrawalLimits,
  IPWhitelistEntry,
  TreasuryWebhook,
  WebhookDelivery,
  WebhookDeliveryStats,
  CreateWithdrawalPayload,
  CreateWithdrawalResponse,
  UpdateLimitsPayload,
  AddIPWhitelistPayload,
  CreateWebhookPayload,
  UpdateWebhookPayload,
} from '../types/treasury';

/**
 * Treasury module for managing treasury accounts, withdrawals, and yield
 *
 * Provides full access to treasury operations including:
 * - Read-only queries (balances, yield, transactions)
 * - Withdrawal requests (requires 2FA, IP whitelist, and limits)
 * - Limit management (self-service reduction)
 * - IP whitelist management (API key only)
 * - Webhook management
 *
 * @example
 * ```typescript
 * import { BeepClient } from '@beep-it/sdk-core';
 *
 * const beep = new BeepClient({
 *   apiKey: 'your_secret_api_key'
 * });
 *
 * // Get treasury info
 * const info = await beep.treasury.getTreasuryInfo();
 * console.log('Total balance:', info.totalBalanceUSD);
 *
 * // Create withdrawal (requires 2FA)
 * const withdrawal = await beep.treasury.createWithdrawal({
 *   amount: '1000000', // 1 USDC (6 decimals)
 *   chain: 'SOLANA',
 *   token: 'USDC',
 *   destinationAddress: 'YOUR_WALLET_ADDRESS',
 *   twoFactorCode: '123456' // From authenticator app
 * });
 * ```
 */
export class TreasuryModule {
  constructor(private client: AxiosInstance) {}

  // =====================================================================
  // READ-ONLY OPERATIONS (No 2FA required)
  // =====================================================================

  /**
   * Get treasury account information
   *
   * Returns complete treasury state including:
   * - Total balances across all accounts
   * - Individual account details (allocated/unallocated amounts)
   * - Total yield earned
   * - Current APY
   * - Beeper points
   *
   * @returns Promise resolving to treasury account information
   * @throws {Error} When API request fails or user is not authenticated
   *
   * @example
   * ```typescript
   * const info = await beep.treasury.getTreasuryInfo();
   * console.log('Total balance:', info.totalBalanceUSD);
   * console.log('Beeper points:', info.totalPoints);
   * ```
   */
  async getTreasuryInfo(): Promise<TreasuryInfo> {
    const response = await this.client.get('/api/v1/treasury/infoWithKey');
    return response.data;
  }

  /**
   * Get yield history for a date range
   *
   * Returns historical yield data based on treasury account snapshots.
   * Includes daily snapshots with balance, yield, and APY information.
   *
   * @param startDate - ISO string start date
   * @param endDate - ISO string end date
   * @returns Promise resolving to yield history
   * @throws {Error} When dates are invalid or API request fails
   *
   * @example
   * ```typescript
   * const history = await beep.treasury.getYieldHistory({
   *   startDate: '2025-01-01',
   *   endDate: '2025-01-31'
   * });
   * console.log('Total yield:', history.totalYield);
   * ```
   */
  async getYieldHistory(params: {
    startDate: string;
    endDate: string;
  }): Promise<YieldHistory> {
    const response = await this.client.get('/api/v1/treasury/snapshots/yield-by-range', {
      params,
    });
    return response.data;
  }

  /**
   * Get transaction history
   *
   * Returns paginated list of treasury transactions including:
   * - Deposits
   * - Withdrawals
   * - Allocations to yield generators
   * - Deallocations from yield generators
   *
   * @param params - Query parameters for filtering and pagination
   * @returns Promise resolving to transaction list
   * @throws {Error} When API request fails
   *
   * @example
   * ```typescript
   * const transactions = await beep.treasury.getTransactions({
   *   limit: 50,
   *   offset: 0,
   *   type: 'withdrawal'
   * });
   * console.log('Total transactions:', transactions.total);
   * ```
   */
  async getTransactions(params?: TransactionQueryParams): Promise<TransactionList> {
    const response = await this.client.get('/api/v1/treasury/transactions', {
      params,
    });
    return response.data;
  }

  /**
   * Get current yield generator allocations
   *
   * Returns detailed information about current allocations including:
   * - Yield generator and protocol names
   * - Allocated amounts
   * - Current values with yield
   * - Individual APYs
   *
   * @returns Promise resolving to array of allocation info
   * @throws {Error} When API request fails
   *
   * @example
   * ```typescript
   * const allocations = await beep.treasury.getAllocations();
   * allocations.forEach(alloc => {
   *   console.log(`${alloc.protocol}: ${alloc.apy}% APY`);
   * });
   * ```
   */
  async getAllocations(): Promise<AllocationInfo[]> {
    const response = await this.client.get('/api/v1/treasury/allocations');
    return response.data;
  }

  /**
   * Get current withdrawal limits
   *
   * Returns withdrawal limits and current usage including:
   * - Daily limit in USD
   * - Per-transaction limit in USD
   * - Current daily usage
   * - Remaining daily limit
   *
   * @returns Promise resolving to withdrawal limits
   * @throws {Error} When API request fails
   *
   * @example
   * ```typescript
   * const limits = await beep.treasury.getLimits();
   * console.log('Daily limit:', limits.dailyLimitUSD);
   * console.log('Remaining:', limits.remainingDailyLimitUSD);
   * ```
   */
  async getLimits(): Promise<WithdrawalLimits> {
    const response = await this.client.get('/api/v1/treasury/limits');
    return response.data;
  }

  // =====================================================================
  // WITHDRAWAL OPERATIONS (2FA required)
  // =====================================================================

  /**
   * Create a new treasury withdrawal request
   *
   * **Security Requirements:**
   * - 2FA code required (from authenticator app)
   * - IP whitelist check (if enabled for API key)
   * - Withdrawal limits check (daily and per-transaction)
   *
   * **Approval Tiers:**
   * - SMALL (<$1,000): Auto-approved immediately
   * - MEDIUM ($1,000-$10,000): Requires email confirmation
   * - LARGE (>$10,000): Requires manual admin approval
   *
   * @param payload - Withdrawal request parameters
   * @returns Promise resolving to created withdrawal request
   * @throws {Error} When 2FA is invalid, limits exceeded, or API request fails
   *
   * @example
   * ```typescript
   * const withdrawal = await beep.treasury.createWithdrawal({
   *   amount: '1000000', // 1 USDC (6 decimals)
   *   chain: 'SOLANA',
   *   token: 'USDC',
   *   destinationAddress: 'YOUR_WALLET_ADDRESS',
   *   twoFactorCode: '123456' // From authenticator app
   * });
   * console.log('Withdrawal ID:', withdrawal.withdrawalRequestId);
   * console.log('Status:', withdrawal.status);
   * ```
   */
  async createWithdrawal(payload: CreateWithdrawalPayload): Promise<CreateWithdrawalResponse> {
    const response = await this.client.post('/api/v1/treasury/withdraw', payload);
    return response.data;
  }

  /**
   * Get withdrawal request status
   *
   * Returns detailed status of a withdrawal request including:
   * - Current status
   * - Approval information (if applicable)
   * - 2FA and email confirmation status
   * - Creation and update timestamps
   *
   * @param withdrawalId - Withdrawal request ID
   * @returns Promise resolving to withdrawal request details
   * @throws {Error} When withdrawal not found or API request fails
   *
   * @example
   * ```typescript
   * const status = await beep.treasury.getWithdrawalStatus('123');
   * console.log('Status:', status.status);
   * if (status.approval) {
   *   console.log('Approvals:', status.approval.currentApprovals);
   * }
   * ```
   */
  async getWithdrawalStatus(withdrawalId: string): Promise<WithdrawalRequest> {
    const response = await this.client.get(`/api/v1/treasury/withdraw/${withdrawalId}`);
    return response.data;
  }

  /**
   * Cancel a pending withdrawal request
   *
   * Only withdrawals in REQUESTED or IN_PROGRESS status can be cancelled.
   * Completed, cancelled, or failed withdrawals cannot be cancelled.
   *
   * @param withdrawalId - Withdrawal request ID to cancel
   * @returns Promise resolving to cancellation confirmation
   * @throws {Error} When withdrawal cannot be cancelled or API request fails
   *
   * @example
   * ```typescript
   * const result = await beep.treasury.cancelWithdrawal('123');
   * console.log('Cancelled:', result.cancelled);
   * ```
   */
  async cancelWithdrawal(
    withdrawalId: string,
  ): Promise<{ cancelled: boolean; withdrawalRequestId: number }> {
    const response = await this.client.post(`/api/v1/treasury/withdraw/${withdrawalId}/cancel`);
    return response.data;
  }

  /**
   * Wait for withdrawal completion with polling
   *
   * Polls withdrawal status until it reaches a terminal state (COMPLETED, CANCELLED, or FAILED).
   * Useful for automated workflows that need to wait for withdrawal processing.
   *
   * @param withdrawalId - Withdrawal request ID to monitor
   * @param options - Polling options (timeout and interval)
   * @returns Promise resolving to final withdrawal status
   * @throws {Error} When timeout is reached or API request fails
   *
   * @example
   * ```typescript
   * const finalStatus = await beep.treasury.waitForWithdrawalCompletion('123', {
   *   timeout: 300000, // 5 minutes
   *   pollInterval: 5000 // Check every 5 seconds
   * });
   * console.log('Final status:', finalStatus.status);
   * ```
   */
  async waitForWithdrawalCompletion(
    withdrawalId: string,
    options: { timeout?: number; pollInterval?: number } = {},
  ): Promise<WithdrawalRequest> {
    const { timeout = 300000, pollInterval = 5000 } = options;
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const status = await this.getWithdrawalStatus(withdrawalId);

      if (['COMPLETED', 'CANCELLED', 'FAILED'].includes(status.status)) {
        return status;
      }

      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }

    throw new Error(`Withdrawal polling timeout after ${timeout}ms`);
  }

  // =====================================================================
  // LIMIT MANAGEMENT
  // =====================================================================

  /**
   * Update withdrawal limits
   *
   * **Self-service reduction only:**
   * - You can reduce your limits at any time
   * - Increases require admin approval (contact support)
   *
   * Default limits: $10,000 daily and per-transaction
   *
   * @param payload - New limit values (optional, provide one or both)
   * @returns Promise resolving to updated limits
   * @throws {Error} When trying to increase limits or API request fails
   *
   * @example
   * ```typescript
   * const updated = await beep.treasury.updateLimits({
   *   dailyLimitUSD: '5000', // Reduce daily limit to $5,000
   *   perTransactionLimitUSD: '2500' // Reduce per-tx limit to $2,500
   * });
   * console.log('New daily limit:', updated.dailyLimitUSD);
   * ```
   */
  async updateLimits(payload: UpdateLimitsPayload): Promise<WithdrawalLimits> {
    const response = await this.client.put('/api/v1/treasury/limits', payload);
    return response.data;
  }

  // =====================================================================
  // IP WHITELIST MANAGEMENT (API key only)
  // =====================================================================

  /**
   * List IP whitelist entries
   *
   * Returns all IP addresses/ranges whitelisted for the current API key.
   * Supports CIDR notation (e.g., "192.168.1.0/24").
   *
   * **Note:** Only available when using API key authentication
   *
   * @returns Promise resolving to array of whitelist entries
   * @throws {Error} When using session auth or API request fails
   *
   * @example
   * ```typescript
   * const whitelist = await beep.treasury.listIPWhitelist();
   * whitelist.forEach(entry => {
   *   console.log(`${entry.ipAddress} - ${entry.label}`);
   * });
   * ```
   */
  async listIPWhitelist(): Promise<IPWhitelistEntry[]> {
    const response = await this.client.get('/api/v1/treasury/ip-whitelist');
    return response.data.whitelist;
  }

  /**
   * Add IP address to whitelist
   *
   * Adds a new IP address or CIDR range to the whitelist.
   * Once IP whitelisting is enabled, only requests from whitelisted IPs will be allowed.
   *
   * **CIDR notation supported:**
   * - Single IP: "192.168.1.100"
   * - IP range: "192.168.1.0/24"
   *
   * @param payload - IP address/range and optional label
   * @returns Promise resolving to created whitelist entry
   * @throws {Error} When IP format is invalid or API request fails
   *
   * @example
   * ```typescript
   * const entry = await beep.treasury.addIPWhitelist({
   *   ipAddress: '192.168.1.100',
   *   label: 'Office network'
   * });
   * console.log('Added IP:', entry.ipAddress);
   * ```
   */
  async addIPWhitelist(payload: AddIPWhitelistPayload): Promise<IPWhitelistEntry> {
    const response = await this.client.post('/api/v1/treasury/ip-whitelist', payload);
    return response.data;
  }

  /**
   * Remove IP address from whitelist
   *
   * Removes an IP address/range from the whitelist.
   *
   * @param ipWhitelistId - Whitelist entry ID to remove
   * @returns Promise resolving to deletion confirmation
   * @throws {Error} When entry not found or API request fails
   *
   * @example
   * ```typescript
   * await beep.treasury.removeIPWhitelist('whitelist-entry-id');
   * console.log('IP removed from whitelist');
   * ```
   */
  async removeIPWhitelist(ipWhitelistId: string): Promise<{ deleted: boolean }> {
    const response = await this.client.delete(`/api/v1/treasury/ip-whitelist/${ipWhitelistId}`);
    return response.data;
  }

  // =====================================================================
  // WEBHOOK MANAGEMENT
  // =====================================================================

  /**
   * List webhooks
   *
   * Returns all webhooks configured for treasury events.
   *
   * @returns Promise resolving to array of webhooks
   * @throws {Error} When API request fails
   *
   * @example
   * ```typescript
   * const webhooks = await beep.treasury.listWebhooks();
   * webhooks.forEach(webhook => {
   *   console.log(`${webhook.url} - ${webhook.events.join(', ')}`);
   * });
   * ```
   */
  async listWebhooks(): Promise<TreasuryWebhook[]> {
    const response = await this.client.get('/api/v1/treasury/webhooks');
    return response.data.webhooks;
  }

  /**
   * Create a new webhook
   *
   * Creates a webhook to receive real-time notifications for treasury events.
   *
   * **Event Types:**
   * - treasury.deposit - New deposits
   * - treasury.withdrawal.requested - Withdrawal requested
   * - treasury.withdrawal.approved - Withdrawal approved
   * - treasury.withdrawal.completed - Withdrawal completed
   * - treasury.withdrawal.failed - Withdrawal failed
   * - treasury.balance.changed - Balance changed
   * - treasury.yield.earned - Yield earned
   *
   * **Security:**
   * - Webhook URL must use HTTPS
   * - Secret is used for HMAC-SHA256 signature verification
   * - Auto-generated secret if not provided
   *
   * @param payload - Webhook configuration
   * @returns Promise resolving to created webhook (includes secret)
   * @throws {Error} When URL is not HTTPS or API request fails
   *
   * @example
   * ```typescript
   * const webhook = await beep.treasury.createWebhook({
   *   url: 'https://example.com/webhooks/treasury',
   *   events: [
   *     'treasury.withdrawal.completed',
   *     'treasury.yield.earned'
   *   ]
   * });
   * console.log('Webhook secret:', webhook.secret);
   * ```
   */
  async createWebhook(payload: CreateWebhookPayload): Promise<TreasuryWebhook> {
    const response = await this.client.post('/api/v1/treasury/webhooks', payload);
    return response.data;
  }

  /**
   * Update webhook
   *
   * Updates webhook configuration including URL, events, or active status.
   *
   * @param webhookId - Webhook ID to update
   * @param payload - Updated webhook properties
   * @returns Promise resolving to updated webhook
   * @throws {Error} When webhook not found or API request fails
   *
   * @example
   * ```typescript
   * const updated = await beep.treasury.updateWebhook('webhook-id', {
   *   events: ['treasury.withdrawal.completed'],
   *   isActive: true
   * });
   * console.log('Updated webhook:', updated.id);
   * ```
   */
  async updateWebhook(
    webhookId: string,
    payload: UpdateWebhookPayload,
  ): Promise<TreasuryWebhook> {
    const response = await this.client.put(`/api/v1/treasury/webhooks/${webhookId}`, payload);
    return response.data;
  }

  /**
   * Delete webhook
   *
   * Permanently deletes a webhook. This cannot be undone.
   *
   * @param webhookId - Webhook ID to delete
   * @returns Promise resolving to deletion confirmation
   * @throws {Error} When webhook not found or API request fails
   *
   * @example
   * ```typescript
   * await beep.treasury.deleteWebhook('webhook-id');
   * console.log('Webhook deleted');
   * ```
   */
  async deleteWebhook(webhookId: string): Promise<{ deleted: boolean }> {
    const response = await this.client.delete(`/api/v1/treasury/webhooks/${webhookId}`);
    return response.data;
  }

  /**
   * Get webhook delivery history
   *
   * Returns recent delivery attempts for a webhook including:
   * - Delivery status and timestamps
   * - Response codes
   * - Retry attempts
   * - Overall statistics
   *
   * @param webhookId - Webhook ID
   * @param limit - Max number of deliveries to return (default: 100)
   * @returns Promise resolving to delivery history and stats
   * @throws {Error} When webhook not found or API request fails
   *
   * @example
   * ```typescript
   * const { deliveries, stats } = await beep.treasury.getWebhookDeliveries('webhook-id', 50);
   * console.log('Total deliveries:', stats.total);
   * console.log('Success rate:', stats.successful / stats.total);
   * ```
   */
  async getWebhookDeliveries(
    webhookId: string,
    limit: number = 100,
  ): Promise<{ deliveries: WebhookDelivery[]; stats: WebhookDeliveryStats }> {
    const response = await this.client.get(`/api/v1/treasury/webhooks/${webhookId}/deliveries`, {
      params: { limit },
    });
    return response.data;
  }
}
