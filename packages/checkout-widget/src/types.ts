import { BeepPurchaseAsset, CreateProductPayload } from '@beep-it/sdk-core';

/**
 * Props for the CheckoutWidget component.
 *
 * The CheckoutWidget provides a complete Solana-based payment interface with support
 * for both existing product references and dynamic product creation. It automatically
 * calculates totals, generates Solana Pay QR codes, and polls for payment completion.
 *
 * Payment Flow:
 * 1. Asset Processing: Validates and processes all assets (existing/new products)
 * 2. Total Calculation: Computes total amount from all asset quantities and prices
 * 3. QR Code Generation: Creates Solana Pay URL with embedded payment details
 * 4. Status Polling: Monitors payment status every 15 seconds until completion
 * 5. Success Display: Shows confirmation when payment is verified on-chain
 *
 * Asset Types Supported:
 * - BeepPurchaseAsset: References existing products by UUID with optional name/description overrides
 * - CreateProductPayload: Creates new products on-the-fly with pricing and token configuration
 *
 * @example
 * ```tsx
 * // Mixed asset types with custom theming
 * <CheckoutWidget
 *   apiKey="beep_live_..."
 *   primaryColor="#3b82f6"
 *   labels={{
 *     scanQr: "Complete your order",
 *     paymentLabel: "Coffee Shop Downtown"
 *   }}
 *   assets={[
 *     // Existing product reference
 *     {
 *       assetId: "coffee-uuid-123",
 *       quantity: 2,
 *       name: "Premium Espresso"
 *     },
 *     // Dynamic product creation
 *     {
 *       name: "Express Delivery",
 *       price: "5.99",
 *       quantity: 1,
 *       token: "USDC"
 *     }
 *   ]}
 *   serverUrl="https://api.yourstore.com"
 * />
 * ```
 */
export interface MerchantWidgetProps {
  /** 
   * Hex color code for theming widget elements (borders, highlights, etc.)
   * @example "#007bff", "#10b981", "#ef4444"
   */
  primaryColor: string;
  
  /** 
   * Customizable text labels for user interface elements 
   */
  labels: {
    /** 
     * Text displayed above QR code to instruct users
     * @default "Scan with your phone or copy address"
     */
    scanQr: string;
    
    /** 
     * Label shown in Solana Pay wallets and transaction descriptions
     * This appears when users scan the QR code or review the transaction
     * @default "Beep Checkout"
     */
    paymentLabel?: string;
  };
  
  /** 
   * BEEP API key for merchant authentication
   * Format: "beep_live_..." for production, "beep_test_..." for testing
   */
  apiKey: string;
  
  /** 
   * Custom BEEP server URL for API calls
   * @default Production BEEP server URL
   */
  serverUrl?: string;
  
  /** 
   * Array of assets (products/services) to purchase
   * 
   * Supports two asset types:
   * - BeepPurchaseAsset: Reference existing products by UUID
   * - CreateProductPayload: Create new products dynamically
   * 
   * All assets must be from the same merchant and priced in the same token.
   * Total amount is automatically calculated from all asset quantities and prices.
   */
  assets: (BeepPurchaseAsset | CreateProductPayload)[];
}

/**
 * Internal state management interface for the CheckoutWidget.
 *
 * This interface represents the internal state tracked throughout the payment
 * lifecycle. The widget manages this state automatically - consumers don't
 * need to provide or manage these values directly.
 *
 * State Lifecycle:
 * 1. Initial: All values null/false, loading true
 * 2. Setup Complete: QR code, reference key, and payment URL populated
 * 3. Polling: Continuously checking payment status via reference key
 * 4. Success: paymentSuccess becomes true when payment confirmed
 * 5. Error: error populated if any step fails
 *
 * @internal This interface is used internally by the widget and not typically needed by consumers
 */
export interface MerchantWidgetState {
  /** 
   * SVG QR code data ready for display, or null during initial loading
   * Generated from the Solana Pay URL for mobile wallet scanning
   */
  qrCode: string | null;
  
  /** 
   * True while making API calls (setup, status polling, etc.)
   * Used to display loading indicators to users
   */
  loading: boolean;
  
  /** 
   * Human-readable error message if any operation fails
   * Includes setup errors, network failures, payment errors, etc.
   */
  error: string | null;
  
  /** 
   * Unique payment reference key for tracking this specific payment
   * Used to poll payment status and link blockchain transactions to the payment
   */
  referenceKey: string | null;
  
  /** 
   * Complete Solana Pay URI containing payment details
   * Format: solana:<recipient>?amount=<amount>&spl-token=<token>&reference=<ref>&label=<label>&message=<msg>
   */
  paymentUrl: string | null;
  
  /** 
   * True when payment has been successfully confirmed on the Solana blockchain
   * Triggers the success state display in the widget
   */
  paymentSuccess: boolean;
}
