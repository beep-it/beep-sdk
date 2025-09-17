/**
 * @fileoverview Beep Checkout Widget - Embedded Solana payment interface
 * 
 * A React component library for integrating BEEP payment functionality into web applications.
 * Provides a complete Solana payment interface with QR code generation, status tracking, and customization options.
 * 
 * @example Basic usage with existing products
 * ```tsx
 * import { CheckoutWidget, type MerchantWidgetProps } from '@beep-it/checkout-widget';
 * 
 * function App() {
 *   return (
 *     <CheckoutWidget
 *       publishableKey="beep_pk_your_key"
 *       primaryColor="#007bff"
 *       labels={{
 *         scanQr: "Scan to pay with Solana wallet",
 *         paymentLabel: "Your Store Name"
 *       }}
 *       assets={[{ 
 *         assetId: "premium-subscription-uuid", 
 *         quantity: 1,
 *         name: "Premium Subscription"
 *       }]}
 *       serverUrl="https://your-beep-server.com"
 *     />
 *   );
 * }
 * ```
 * 
 * @example Creating products on-the-fly
 * ```tsx
 * import { CheckoutWidget } from '@beep-it/checkout-widget';
 * 
 * function DynamicCheckout() {
 *   return (
 *     <CheckoutWidget
 *       publishableKey="beep_pk_your_key"
 *       primaryColor="#10b981"
 *       labels={{
 *         scanQr: "Complete your order",
 *         paymentLabel: "Coffee Shop"
 *       }}
 *       assets={[
 *         {
 *           name: "Espresso",
 *           price: "4.99",
 *           quantity: 2,
 *           token: "USDC",
 *           description: "Premium espresso shots"
 *         }
 *       ]}
 *     />
 *   );
 * }
 * ```
 */

// Main component export
export { CheckoutWidget } from './CheckoutWidget';

// Type exports for TypeScript users
export type { 
  MerchantWidgetProps, 
  MerchantWidgetState 
} from './types';

// Re-export core types that users might need
export type { 
  BeepPurchaseAsset, 
  CreateProductPayload 
} from '@beep-it/sdk-core';
