import { BeepPurchaseAsset, CreateProductPayload } from '@beep-it/sdk-core';

/**
 * Props for the CheckoutWidget component.
 * 
 * This widget handles the complete payment flow:
 * 1. Generates QR code for Solana Pay
 * 2. Displays payment amount and wallet address
 * 3. Polls for payment completion
 */
export interface MerchantWidgetProps {
  /** Hex color for theming the widget border (#007bff) */
  primaryColor: string;
  /** Customizable text labels */
  labels: {
    /** Text shown above QR code (default: "Scan with your phone or copy address") */
    scanQr: string;
  };
  /** Beep API key for authentication */
  apiKey: string;
  /** Optional custom server URL (defaults to Beep production) */
  serverUrl?: string;
  /** Assets to purchase - either existing product references or new product definitions */
  assets: (BeepPurchaseAsset | CreateProductPayload)[];
}

/**
 * Internal state management for the CheckoutWidget.
 * 
 * Tracks the payment lifecycle from initial load through completion.
 */
export interface MerchantWidgetState {
  /** Base64 QR code image data or null during loading */
  qrCode: string | null;
  /** True while fetching payment data from API */
  loading: boolean;
  /** Error message or null if no errors */
  error: string | null;
  /** Payment reference key used for polling status */
  referenceKey: string | null;
  /** Solana Pay URI (solana:address?params) for QR code */
  paymentUrl: string | null;
  /** True when payment has been confirmed on-chain */
  paymentSuccess: boolean;
}
