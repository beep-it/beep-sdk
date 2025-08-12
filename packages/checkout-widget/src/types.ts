export interface MerchantWidgetProps {
  merchantId: string;
  amount: number;
  primaryColor: string;
  labels: {
    scanQr: string;
  };
  apiKey: string;
  serverUrl?: string;
}

export interface MerchantWidgetState {
  qrCode: string | null;
  loading: boolean;
  error: string | null;
}