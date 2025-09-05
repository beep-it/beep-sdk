# @beep-it/checkout-widget

A React component for displaying BEEP merchant payment widgets with QR code functionality.

## Installation

```bash
npm install @beep-it/checkout-widget @beep-it/sdk-core
```

## Usage

```tsx
import React from 'react';
import { MerchantWidget } from '@beep-it/checkout-widget';

function App() {
  return (
    <CheckoutWidget
      merchantId="your-merchant-id"
      amount={25.50}
      primaryColor="#007bff"
      labels={{
        scanQr: "Scan QR Code to Pay"
      }}
      apiKey="your-api-key"
      serverUrl="https://your-beep-server.com" // optional
    />
  );
}
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `merchantId` | `string` | Yes | The merchant ID for payment processing |
| `amount` | `number` | Yes | The payment amount in decimal format (e.g., 25.50) |
| `primaryColor` | `string` | Yes | Primary color for styling the widget (hex format) |
| `labels` | `object` | Yes | Labels for the widget |
| `labels.scanQr` | `string` | Yes | Text to display above the QR code |
| `apiKey` | `string` | Yes | API key for authentication with BEEP services |
| `serverUrl` | `string` | No | Custom server URL (defaults to environment variable or production) |

## Features

- Automatically generates QR codes for crypto wallet payments
- Responsive design with customizable styling
- Loading and error states
- TypeScript support
- Comprehensive test coverage

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
```

## Environment Variables

The widget respects the following environment variables:

- `REACT_APP_BEEP_SERVER_URL`: Default server URL if not provided via props