/**
 * @fileoverview Beep Checkout Widget - Embedded Solana payment interface
 * 
 * @example Basic usage
 * ```tsx
 * import { CheckoutWidget } from '@beep/checkout-widget';
 * 
 * function App() {
 *   return (
 *     <CheckoutWidget
 *       amount={29.99}
 *       primaryColor="#007bff"
 *       apiKey="your-beep-api-key"
 *       labels={{
 *         scanQr: "Scan to pay with Solana wallet"
 *       }}
 *       assets={[{ assetId: "premium-subscription", quantity: 1 }]}
 *     />
 *   );
 * }
 * ```
 */

export { CheckoutWidget } from './CheckoutWidget';
export type { MerchantWidgetProps, MerchantWidgetState } from './types';
