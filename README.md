# BEEP SDK

A comprehensive TypeScript SDK for integrating with the BEEP Solana payment platform. Enables one-time stablecoin payments, invoice management, and MCP (Model Context Protocol) server integration.

## 📦 Packages Overview

The BEEP SDK is organized as a monorepo with focused packages for different use cases:

### [`@beep-it/sdk-core`](./packages/core)

**Core TypeScript SDK for server-side and client-side integrations**

- Full API client with support for invoices, payments, and products
- Browser-safe public client for frontend applications
- Comprehensive TypeScript types and interfaces
- Built-in error handling and request/response validation

```bash
npm install @beep-it/sdk-core
```

**Use Cases:**

- Server-side payment processing
- Frontend applications (with publishable keys)
- Custom payment integrations
- API wrappers and middleware

---

### [`@beep-it/checkout-widget`](./packages/checkout-widget)

**React component for embedded Solana payment interfaces**

- Drop-in React component for payment processing
- QR code generation for Solana Pay
- Real-time payment status polling
- Customizable theming and labels
- Zero CSS dependencies (inline styling)

```bash
npm install @beep-it/checkout-widget @beep-it/sdk-core
```

**Use Cases:**

- E-commerce checkout flows
- Service payment forms
- Digital product purchases
- Donation widgets
- Event ticketing

---

### [`@beep-it/cli`](./packages/cli)

**CLI tool for MCP server scaffolding and project templates**

- Generate MCP server boilerplate code
- Multiple transport support (HTTP, stdio, SSE)
- Project templates with best practices
- Integration with core SDK

```bash
npm install -g @beep-it/cli
beep init my-mcp-server
```

**Use Cases:**

- AI agent payment integrations
- MCP server development
- Claude Desktop integrations
- Automated payment workflows

---

### [`packages/mcp`](./packages/mcp)

**Documentation and integration guides for MCP protocol**

- MCP server implementation examples
- Transport protocol documentation
- Integration patterns and best practices
- Authentication and security guides

**Use Cases:**

- Understanding MCP integration
- Reference implementation
- Production deployment guides

## 🚀 Quick Start

### For Frontend Applications (React)

```tsx
import { CheckoutWidget } from '@beep-it/checkout-widget';

function CheckoutPage() {
  return (
    <CheckoutWidget
      publishableKey="beep_pk_your_key"
      labels={{ scanQr: 'Pay with Solana wallet' }}
      assets={[{ name: 'Premium Plan', price: '29.99' }]}
      primaryColor="#3b82f6"
    />
  );
}
```

### For Backend Applications (Node.js)

```typescript
import { BeepClient } from '@beep-it/sdk-core';

const client = new BeepClient({
  apiKey: 'beep_sk_your_secret_key',
  baseURL: 'https://api.justbeep.it',
});

// Create an invoice
const invoice = await client.invoices.create({
  merchantId: 'your-merchant-id',
  items: [{ name: 'Product', price: '25.00', quantity: 1 }],
});
```

### For MCP Server Development

```bash
# Install CLI globally
npm install -g @beep-it/cli

# Create new MCP server
beep init my-payment-server --transport=http
cd my-payment-server

# Start development
npm run dev
```

## 🏗 Development Setup

This is a pnpm workspace monorepo. To work with all packages:

```bash
# Clone the repository
git clone https://github.com/beep-it/beep-sdk.git
cd beep-sdk

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests for all packages
pnpm test

# Start development mode (all packages)
pnpm dev
```

### Individual Package Development

```bash
# Work on a specific package
cd packages/checkout-widget

# Install dependencies (from root)
pnpm install

# Build this package only
pnpm build

# Run tests for this package
pnpm test

# Start development
pnpm dev
```

## 🔐 Authentication & Security

### Key Types

- **`beep_pk_*`** - Publishable keys (browser-safe, frontend use)
- **`beep_sk_*`** - Secret keys (server-side only, never expose)

### Security Best Practices

- Never use secret keys in frontend applications
- Store API keys securely (environment variables, secret managers)
- Use publishable keys for client-side integrations
- Validate payments on your backend before fulfilling orders

## 📚 Documentation

Each package contains comprehensive documentation:

- **Core SDK**: [`./packages/core/README.md`](./packages/core/README.md)
- **Checkout Widget**: [`./packages/checkout-widget/README.md`](./packages/checkout-widget/README.md)
- **CLI Tool**: [`./packages/cli/README.md`](./packages/cli/README.md)
- **MCP Integration**: [`./packages/mcp/README.md`](./packages/mcp/README.md)

## 🔗 Links

- **Platform**: [justbeep.it](https://app.justbeep.it)
- **Documentation**: [docs.justbeep.it](https://api.dev.justbeep.it/api-docs/))
- **GitHub Issues**: [beep-it/beep-sdk/issues](https://github.com/beep-it/beep-sdk/issues)
- **NPM Packages**: [@beep-it](https://www.npmjs.com/org/beep-it)

## 📄 License

MIT - See [LICENSE](./LICENSE) for details.

---

**Built for Solana** • **Powered by Stablecoins** • **Designed for Developers**
