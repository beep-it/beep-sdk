# The BEEP PAY SDK: Turn Your Cool Sh\*t into Revenue - now on SUI 💸

Accept credit cards, USDC and receive revenue in USDC on SUI wallets

Alright, let's be real. You made something awesome. A game, an app, a digital masterpiece. And now you wanna get paid for it. As you should! But dealing with payments is a whole vibe killer. 

That’s where **Beep** comes in.

Beep makes it stupid simple to accept **USDC payments** on the **SUI network**, fully **self-custodial**, **AEO-ready**, and **AI-native**.  
No banks. No bridges. No nonsense.

---

## Table of Contents

- [What is this?](#-so-like-what-even-is-this)
- [🖥️ Server-Side SDK (BeepClient)](#server-side-sdk-beepclient)
  - [Server-Side Setup](#server-side-setup)
  - [Server-Side Making Money](#server-side-making-money)
  - [Server-Side API Reference](#server-side-api-reference)
- [📱 Frontend SDK (BeepPublicClient)](#frontend-sdk-beeppublicclient)
  - [Frontend Setup](#frontend-setup)
  - [Frontend Making Money](#frontend-making-money)
  - [Frontend API Reference](#frontend-api-reference)
- [Token Utilities](#token-utilities)
- [Resources](#resources)

## Which SDK Should I Use?

**🖥️ Backend/Server Code?** → [Server-Side SDK (BeepClient)](#server-side-sdk-beepclient)

- Full API access with secret keys
- Server-side only (Node.js, Express, etc.)
- Complete payment processing capabilities
- **Streaming payments support** (issuePayment, startStreaming, etc.)

**📱 Frontend/Browser Code?** → [Frontend SDK (BeepPublicClient)](#frontend-sdk-beeppublicclient)

- Safe for client-side code
- Uses publishable keys (not secret)
- Perfect for React, Vue, or vanilla JS apps
- **Limited to widget endpoints only** (no streaming payments)

## 🤔 So, like, what even _is_ this?

Think of this SDK as your personal cheat code for money. It's a box of pre-written code that you can just drop into your project to handle all the boring payment stuff.

No, you don't need to know what an "SDK" is. Just know this: **this is the easy button.**

With this, you can:

- **Give your users a "wallet"**: It's not a real wallet. It's just a secure spot online for them to keep their digital cash to pay you with. We handle all the scary security stuff.
- **Ask for money (nicely)**: Create an "invoice," which is just a fancy word for a bill. It's like sending a Venmo request, but for your app.
- **Actually get paid**: Process the payment and see the money roll in. Cha-ching.

Basically, we're the ✨ unpaid intern ✨ who handles your finances so you can get back to creating.

---

## Server-Side SDK (BeepClient)

Perfect for Node.js, Express servers, Next.js API routes, and any backend code where you can safely store secret keys.

### Server-Side Setup

#### Step 1: Install the SDK

```bash
npm install @beep-it/sdk-core
```

#### Step 2: Get Your Secret API Key

1. Sign up for a BEEP account at [app.justbeep.it](https://app.justbeep.it)
2. Go to your account settings and find your secret API key
3. **Never expose this in client-side code!** Keep it on your server only.

#### Step 3: Initialize BeepClient

```typescript
import { BeepClient, SupportedToken } from '@beep-it/sdk-core';

const beep = new BeepClient({
  apiKey: 'your_secret_api_key_here', // Keep this secure!
});
```

### Server-Side Making Money

Let's say you want to charge someone 5 USDT for a pack of 100 magic crystals in your game. Here's the complete server-side flow:

#### The Server-Side Payment Flow

1. **You create an invoice** - This is literally just you telling our servers "hey, I want $X for Y reason"
2. **We create an invoice** - Think of this as a digital receipt that says "pay this amount pls"
3. **We give you back payment details** - This includes:
   - A `paymentUrl` (a link you can send to your customer)
   - A `qrCode` (same link but as a scannable QR code for mobile)
   - A `referenceKey` (a unique ID to track this specific payment)
   - An `invoiceId` (the invoice ID you can use to check payment status later)
4. **Your user pays** - They click the link or scan the code and pay using their crypto wallet
5. **We handle the crypto magic** - All the blockchain validation, token transfers, etc.
6. **You get notified** - Either through webhooks (if you set those up) or by checking the status
7. **Money lands in your account** - Cha-ching! 🤑

Seriously, all _you_ need to worry about is step 1. We handle 2-7 because we're nice like that.

```typescript
// Server-side invoice creation
const invoiceDetails = {
  description: 'A pack of 100 magic crystals',
  amount: '5.00',
  token: SupportedToken.USDT,
  payerType: 'customer_wallet' as const,
};

try {
  const invoice = await beep.invoices.createInvoice(invoiceDetails);

  // Send this payment info to your frontend
  res.json({
    qrCode: invoice.qrCode,
    paymentUrl: invoice.paymentUrl,
    referenceKey: invoice.referenceKey,
    invoiceId: invoice.id,
  });

  // Later, check if payment completed
  const updatedInvoice = await beep.invoices.getInvoice(invoice.id!);
  if (updatedInvoice.status === 'paid') {
    // Unlock content for the user!
  }
} catch (error) {
  console.error('Invoice creation failed:', error.message);
}
```

### Server-Side API Reference

#### Creating Invoices

```typescript
const invoice = await beep.invoices.createInvoice({
  amount: '19.99',
  token: SupportedToken.USDT,
  description: 'VIP Battle Pass',
  payerType: 'customer_wallet',
});
```

#### Managing Products

```typescript
// Create a product
const product = await beep.products.createProduct({
  name: 'Magic Sword',
  price: '9.99',
  token: SupportedToken.USDT,
  isSubscription: false,
});

// List all products
const products = await beep.products.listProducts();
```

#### Payment Processing

```typescript
// Request asset purchase
const payment = await beep.payments.requestAndPurchaseAsset({
  assets: [{ assetId: 'product-uuid', quantity: 1 }],
  generateQrCode: true,
});

// Wait for payment completion
const { paid } = await beep.payments.waitForPaymentCompletion({
  assets: [{ assetId: 'product-uuid', quantity: 1 }],
  paymentReference: payment.referenceKey,
});
```

#### Streaming Payments (BeepClient Only)

**Important:** Streaming payment methods are only available with `BeepClient` using secret API keys. They do NOT work with `BeepPublicClient` or publishable keys.

```typescript
// Issue a streaming payment session
const session = await beep.payments.issuePayment({
  apiKey: 'your_secret_api_key',
  assetChunks: [
    { assetId: 'video-content-uuid', quantity: 1 },
    { assetId: 'api-access-uuid', quantity: 100 }
  ],
  payingMerchantId: 'merchant_who_pays'
});

// Start charging for usage
await beep.payments.startStreaming({
  apiKey: 'your_secret_api_key',
  invoiceId: session.invoiceId
});

// Pause billing temporarily
await beep.payments.pauseStreaming({
  apiKey: 'your_secret_api_key',
  invoiceId: session.invoiceId
});

// Stop and finalize charges
const result = await beep.payments.stopStreaming({
  apiKey: 'your_secret_api_key',
  invoiceId: session.invoiceId
});
```

---

## Frontend SDK (BeepPublicClient)

Perfect for React, Vue, vanilla JS, or any client-side code where you can't safely store secret keys.

### Frontend Setup

#### Step 1: Install the SDK

```bash
npm install @beep-it/sdk-core
```

#### Step 2: Get Your Publishable Key

1. Sign up for a BEEP account at [app.justbeep.it](https://app.justbeep.it)
2. Go to your account settings and find your publishable key (starts with `beep_pk_`)
3. This is safe to expose in client-side code!

#### Step 3: Initialize BeepPublicClient

```typescript
import { BeepPublicClient, SupportedToken } from '@beep-it/sdk-core';

const publicBeep = new BeepPublicClient({
  publishableKey: 'beep_pk_your_publishable_key_here', // Safe for browsers!
});
```

### Frontend Making Money

Here's how to create a complete payment flow in your React app:

#### The Frontend Payment Flow

```typescript
// Create a payment session with mixed assets
const handlePurchase = async () => {
  try {
    const session = await publicBeep.widget.createPaymentSession({
      assets: [
        // Use existing products
        { assetId: 'existing-product-uuid', quantity: 1 },
        // Or create items on-the-fly
        {
          name: 'Custom Magic Potion',
          price: '12.50',
          quantity: 2,
          description: 'Instant health boost',
        },
      ],
      paymentLabel: 'My Awesome Game Store',
    });

    // Show payment URL/QR to user
    setPaymentUrl(session.paymentUrl);
    setReferenceKey(session.referenceKey);

    // Start polling for payment completion
    const { paid } = await publicBeep.widget.waitForPaid({
      referenceKey: session.referenceKey,
      intervalMs: 5000, // Check every 5 seconds
      timeoutMs: 5 * 60 * 1000, // 5 minute timeout
    });

    if (paid) {
      // Payment successful! Unlock content
      setShowSuccessMessage(true);
      unlockPremiumFeatures();
    }
  } catch (error) {
    console.error('Payment failed:', error);
  }
};
```

### Frontend API Reference

#### Creating Payment Sessions

```typescript
const session = await publicBeep.widget.createPaymentSession({
  assets: [
    { assetId: 'existing-product', quantity: 1 },
    { name: 'Custom Item', price: '5.99', quantity: 1 },
  ],
  paymentLabel: 'Your Store Name',
});
```

#### Checking Payment Status

```typescript
const status = await publicBeep.widget.getPaymentStatus(referenceKey);
console.log('Payment completed:', status.paid);
```

#### Waiting for Payment (with polling)

```typescript
const { paid, timedOut } = await publicBeep.widget.waitForPaid({
  referenceKey: session.referenceKey,
  intervalMs: 5000,
  timeoutMs: 300000, // 5 minutes
});
```

---

## 🤓 Advanced API Reference

## Token Utilities

### `SupportedToken`

Clean token enum instead of remembering addresses:

```typescript
import { SupportedToken } from '@beep-it/sdk-core';

const token = SupportedToken.USDT; // Much cleaner!
```

### `TokenUtils`

Advanced token utilities:

```typescript
import { TokenUtils, SupportedToken } from '@beep-it/sdk-core';

// Get the address from a token enum
const address = TokenUtils.getTokenAddress(SupportedToken.USDT);

// Check if we support a token
const isSupported = TokenUtils.isTokenSupported(SupportedToken.USDT);

// Get a token enum from an address (reverse lookup)
const token = TokenUtils.getTokenFromAddress('Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB');
```

---

## Resources

[Beep llms.txt](https://www.justbeep.it/llms.txt)

---

## License

MIT. Go wild.
#### Payouts (BeepClient Only)

Initiate a payout from your treasury wallet to an external address. Requires a secret API key and must be called server-side.

Notes:
- The server derives the source wallet from your API key's merchant and the requested chain; you do not provide a walletId.
- `amount` must be provided in the token's smallest units (integer as a string). For USDC with 6 decimals, 1.00 USDC = "1000000".
- The response indicates acceptance or rejection. Execution happens asynchronously after treasury funds are reserved.

Example:
```ts
import { BeepClient } from '@beep-it/sdk-core';

const beep = new BeepClient({ apiKey: process.env.BEEP_API_KEY! });

const result = await beep.createPayout({
  amount: '1000000', // 1.00 USDC (6 decimals)
  destinationWalletAddress: 'DESTINATION_ADDRESS',
  chain: 'SUI',
  token: 'USDC',
});

console.log(result.status, result.message);
```
