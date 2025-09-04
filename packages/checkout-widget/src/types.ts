import { BeepPurchaseAsset } from '@beep/sdk-core';

export interface MerchantWidgetProps {
  amount: number;
  primaryColor: string;
  labels: {
    scanQr: string;
  };
  apiKey: string;
  serverUrl?: string;
  assets: BeepPurchaseAsset;
}

export interface MerchantWidgetState {
  qrCode: string | null;
  loading: boolean;
  error: string | null;
  referenceKey: string | null;
  paymentUrl: string | null;
  paymentSuccess: boolean;
}
