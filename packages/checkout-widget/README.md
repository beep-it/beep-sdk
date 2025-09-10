# @beep-it/checkout-widget

A React component for Solana-based payment processing with QR code generation and real-time payment status polling. Built for the BEEP payment system.

## Installation

```bash
npm install @beep-it/checkout-widget @beep-it/sdk-core
```

## Quick Start

```tsx
import React from 'react';
import { CheckoutWidget } from '@beep-it/checkout-widget';

function App() {
  return (
    <CheckoutWidget
      apiKey="your-api-key"
      primaryColor="#007bff"
      labels={{
        scanQr: "Scan QR Code to Pay",
        paymentLabel: "My Store Checkout"
      }}
      assets={[
        {
          assetId: "product-uuid-123",
          quantity: 2,
          name: "Premium Coffee",
          description: "Fresh roasted arabica beans"
        }
      ]}
      serverUrl="https://your-beep-server.com" // optional
    />
  );
}
```

## Asset Types

The widget supports two types of assets:

### 1. Existing Product References (`BeepPurchaseAsset`)

Reference pre-created products by their ID:

```tsx
const assets = [
  {
    assetId: "product-uuid-123",
    quantity: 1,
    name: "Coffee", // optional override
    description: "Premium blend" // optional override  
  }
];
```

### 2. On-the-Fly Product Creation (`CreateProductPayload`)

Create products dynamically during checkout:

```tsx
const assets = [
  {
    name: "Custom Item",
    price: "25.50",
    quantity: 2,
    description: "Custom product description",
    token: "USDC", // or provide splTokenAddress
    isSubscription: false
  }
];
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `apiKey` | `string` | ✅ | BEEP API key for authentication |
| `primaryColor` | `string` | ✅ | Primary color for styling (hex format, e.g., "#007bff") |
| `labels` | `object` | ✅ | Customizable text labels |
| `labels.scanQr` | `string` | ✅ | Text shown above QR code |
| `labels.paymentLabel` | `string` | ❌ | Label displayed in Solana Pay wallets (default: "Beep Checkout") |
| `assets` | `(BeepPurchaseAsset \| CreateProductPayload)[]` | ✅ | Items to purchase |
| `serverUrl` | `string` | ❌ | Custom BEEP server URL (defaults to production) |

### Asset Props

#### BeepPurchaseAsset

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `assetId` | `string` | ✅ | UUID of existing product |
| `quantity` | `number` | ✅ | Number of items |
| `name` | `string` | ❌ | Override product name |
| `description` | `string` | ❌ | Override product description |

#### CreateProductPayload

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `name` | `string` | ✅ | Product display name |
| `price` | `string` | ✅ | Price in decimal format (e.g., "25.50") |
| `quantity` | `number` | ❌ | Number of items (default: 1) |
| `description` | `string` | ❌ | Product description |
| `token` | `SupportedToken` | ❌ | Token type (USDC, USDT, etc.) |
| `splTokenAddress` | `string` | ❌ | Custom SPL token address |
| `isSubscription` | `boolean` | ❌ | Whether this is a subscription (default: false) |

## Features

### Core Functionality
- **Solana Pay Integration**: Generates standards-compliant Solana Pay QR codes
- **Real-time Status Polling**: Automatically checks payment status every 15 seconds
- **Flexible Asset Support**: Mix existing products with on-the-fly creations
- **Payment Label Support**: Custom labels appear in wallet interfaces
- **Wallet Address Display**: Shows copyable recipient address for desktop users

### User Experience
- **Loading States**: Smooth loading indicators during setup and polling
- **Error Handling**: Comprehensive error boundaries and user-friendly error messages
- **Success Animation**: Clear payment confirmation state
- **Responsive Design**: Works on desktop and mobile devices
- **Customizable Theming**: Primary color theming throughout the widget

### Developer Experience
- **TypeScript Support**: Full type safety with comprehensive interfaces
- **Zero CSS Dependencies**: Inline styles prevent conflicts with host applications
- **Error Boundaries**: Isolated error handling prevents widget crashes from affecting host app
- **Comprehensive Logging**: Detailed console logging for debugging

## Usage Examples

### Simple Single Product

```tsx
<CheckoutWidget
  apiKey="your-api-key"
  primaryColor="#10b981"
  labels={{ scanQr: "Pay with Crypto" }}
  assets={[
    {
      assetId: "coffee-product-uuid",
      quantity: 1
    }
  ]}
/>
```

### Multiple Products with Custom Labels

```tsx
<CheckoutWidget
  apiKey="your-api-key"
  primaryColor="#3b82f6"
  labels={{
    scanQr: "Scan to complete your order",
    paymentLabel: "Coffee Shop - Downtown"
  }}
  assets={[
    {
      assetId: "coffee-uuid",
      quantity: 2,
      name: "Espresso"
    },
    {
      assetId: "pastry-uuid", 
      quantity: 1,
      name: "Croissant"
    }
  ]}
/>
```

### Dynamic Product Creation

```tsx
<CheckoutWidget
  apiKey="your-api-key"
  primaryColor="#ef4444"
  labels={{
    scanQr: "Pay for custom service",
    paymentLabel: "Consulting Services"
  }}
  assets={[
    {
      name: "1-Hour Consultation",
      price: "150.00",
      quantity: 1,
      description: "Professional consulting session",
      token: "USDC"
    }
  ]}
/>
```

### Mixed Asset Types

```tsx
<CheckoutWidget
  apiKey="your-api-key"
  primaryColor="#8b5cf6"
  labels={{ scanQr: "Complete your purchase" }}
  assets={[
    // Existing product
    {
      assetId: "existing-product-uuid",
      quantity: 1
    },
    // Dynamic product
    {
      name: "Rush Delivery",
      price: "15.00",
      quantity: 1,
      token: "USDC"
    }
  ]}
/>
```

## Payment Flow

1. **Setup Phase**: Widget fetches/creates products and generates Solana Pay URL
2. **Display Phase**: Shows QR code and total amount to user
3. **Polling Phase**: Continuously checks payment status every 15 seconds
4. **Completion**: Displays success state when payment is confirmed on-chain

## Error Handling

The widget includes comprehensive error handling:

- **Configuration Errors**: Invalid API keys, missing assets
- **Network Errors**: API connection issues, timeouts
- **Payment Errors**: Failed transactions, expired payments
- **Component Errors**: Isolated error boundaries prevent crashes

## Solana Pay Integration

The widget generates Solana Pay URLs with:
- **Recipient**: Merchant's Solana wallet address
- **Amount**: Total calculated from all assets
- **SPL Token**: Token address for payment
- **Reference**: Unique tracking identifier
- **Label**: Custom payment label for wallet display
- **Message**: Descriptive payment message

## Development

```bash
# Install dependencies
pnpm install

# Run tests
pnpm test

# Build the package  
pnpm build

# Run tests in watch mode
pnpm test:watch

# Run development showcase
pnpm dev
```

## Environment Variables

The widget respects these environment variables:

- `REACT_APP_BEEP_SERVER_URL`: Default server URL if not provided via props

## TypeScript Support

Full TypeScript support with exported interfaces:

```tsx
import { 
  CheckoutWidget, 
  MerchantWidgetProps,
  MerchantWidgetState 
} from '@beep-it/checkout-widget';

import { 
  BeepPurchaseAsset, 
  CreateProductPayload 
} from '@beep-it/sdk-core';
```

## Browser Compatibility

- Modern browsers with ES2017+ support
- React 18+ required
- TanStack Query for state management

## License

See the main BEEP SDK license for details.