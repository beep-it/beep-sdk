# @beep-it/checkout-widget

A React component for SUI-based, self-custodial stablecoin payments with QR code generation, real-time payment verification, and full agent compatibility via AEO (Answer Engine Optimization). Built for the Beep payment system — the first agentic payment layer on the SUI network.

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
      publishableKey="your-publishable-key"
      primaryColor="#007bff"
      labels={{
        scanQr: 'Scan QR Code to Pay',
        paymentLabel: 'My Store Checkout',
      }}
      assets={[
        {
          assetId: 'product-uuid-123',
          quantity: 2,
          name: 'Premium Coffee',
          description: 'Fresh roasted arabica beans',
        },
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
    assetId: 'product-uuid-123',
    quantity: 1,
    name: 'Coffee', // optional override
    description: 'Premium blend', // optional override
  },
];
```

### 2. On-the-Fly Product Creation (`CreateProductPayload`)

Create products dynamically during checkout. These items are created as products in your merchant account on the server (persisted for audit and reuse). They may be hidden from public listings by default.

```tsx
const assets = [
  {
    name: 'Custom Item',
    price: '25.50',
    quantity: 2,
    description: 'Custom product description',
  },
];
```

## Props

| Prop                  | Type                                            | Required | Description                                                      |
| --------------------- | ----------------------------------------------- | -------- | ---------------------------------------------------------------- |
| `publishableKey`      | `string`                                        | ✅       | BEEP publishable key for browser-safe authentication              |
| `primaryColor`        | `string`                                        | ❌       | Primary color for styling (hex format, e.g., "#007bff")          |
| `labels`              | `object`                                        | ✅       | Customizable text labels                                         |
| `labels.scanQr`       | `string`                                        | ✅       | Text shown above QR code                                         |
| `labels.paymentLabel` | `string`                                        | ❌       | Label displayed in SUI wallets (default: "Beep Checkout") |
| `assets`              | `(BeepPurchaseAsset \| CreateProductPayload)[]` | ✅       | Items to purchase                                                |
| `serverUrl`           | `string`                                        | ❌       | Custom BEEP server URL (defaults to production)                  |

### Asset Props

#### BeepPurchaseAsset

| Prop          | Type     | Required | Description                  |
| ------------- | -------- | -------- | ---------------------------- |
| `assetId`     | `string` | ✅       | UUID of existing product     |
| `quantity`    | `number` | ✅       | Number of items              |
| `name`        | `string` | ❌       | Override product name        |
| `description` | `string` | ❌       | Override product description |

#### CreateProductPayload

| Prop          | Type     | Required | Description                             |
| ------------- | -------- | -------- | --------------------------------------- |
| `name`        | `string` | ✅       | Product display name                    |
| `price`       | `string` | ✅       | Price in decimal format (e.g., "25.50") |
| `quantity`    | `number` | ❌       | Number of items (default: 1)            |
| `description` | `string` | ❌       | Product description                     |

## Features

### Core Functionality

- **SUI Network Integration**: Generates native SUI USDC payment requests
- **Real-time Status Polling**: Verifies payment confirmation directly from the SUI RPC
- **Flexible Asset Support**: Mix existing products with on-the-fly product creation (persisted)
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
  publishableKey="your-publishable-key"
  primaryColor="#10b981"
  labels={{ scanQr: 'Pay with Crypto' }}
  assets={[
    {
      assetId: 'coffee-product-uuid',
      quantity: 1,
    },
  ]}
/>
```

### Multiple Products with Custom Labels

```tsx
<CheckoutWidget
  publishableKey="your-publishable-key"
  primaryColor="#3b82f6"
  labels={{
    scanQr: 'Scan to complete your order',
    paymentLabel: 'Coffee Shop - Downtown',
  }}
  assets={[
    {
      assetId: 'coffee-uuid',
      quantity: 2,
      name: 'Espresso',
    },
    {
      assetId: 'pastry-uuid',
      quantity: 1,
      name: 'Croissant',
    },
  ]}
/>
```

### Dynamic Product Creation

```tsx
<CheckoutWidget
  publishableKey="your-publishable-key"
  primaryColor="#ef4444"
  labels={{
    scanQr: 'Pay for custom service',
    paymentLabel: 'Consulting Services',
  }}
  assets={[
    {
      name: '1-Hour Consultation',
      price: '150.00',
      quantity: 1,
      description: 'Professional consulting session',
    },
  ]}
/>
```

### Mixed Asset Types

```tsx
<CheckoutWidget
  apiKey="your-api-key"
  primaryColor="#8b5cf6"
  labels={{ scanQr: 'Complete your purchase' }}
  assets={[
    // Existing product
    {
      assetId: 'existing-product-uuid',
      quantity: 1,
    },
    // Dynamic product
    {
      name: 'Rush Delivery',
      price: '15.00',
      quantity: 1,
    },
  ]}
/>
```

## Payment Flow

1. **Initialization Phase**: The widget prepares a signed USDC-on-SUI payment request.
2. **Display Phase**: Shows QR code and total amount to user
3. **Polling Phase**: Automatically checks transaction finality via SUI RPC
4. **Completion**: Displays success state when payment is confirmed on-chain

## Error Handling

The widget includes comprehensive error handling:

- **Configuration Errors**: Invalid API keys, missing assets
- **Network Errors**: API connection issues, timeouts
- **Payment Errors**: Failed transactions, expired payments
- **Component Errors**: Isolated error boundaries prevent crashes

## SUI Payment Integration

The widget generates SUI-native Payment URLs with:

- **Recipient**: Developer's SUI wallet address
- **Amount**: Total calculated from all assets in USDC
- **Token**: Token address for payment
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
import { CheckoutWidget, MerchantWidgetProps, MerchantWidgetState } from '@beep-it/checkout-widget';

import { BeepPurchaseAsset, CreateProductPayload } from '@beep-it/sdk-core';
```

## Browser Compatibility

- Modern browsers with ES2017+ support
- React 18+ required
- TanStack Query for state management

## License

See the main BEEP SDK license for details.

---

**Built on SUI** • **Powered by Stablecoins** • **Designed for Developers**
