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
- [🏦 Treasury Module](#treasury-module-beepclient-only)
  - [Overview](#overview)
  - [Read-Only Operations](#read-only-operations)
  - [Withdrawal Operations](#withdrawal-operations)
  - [Security Configuration](#security-configuration)
  - [Webhooks](#webhooks)
  - [Complete Withdrawal Flow Example](#complete-withdrawal-flow-example)
  - [Rate Limits](#rate-limits)
  - [Error Handling](#error-handling)
  - [Best Practices](#best-practices)
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

## Treasury Module (BeepClient Only)

### Overview

The Treasury module provides enterprise-grade security for managing treasury accounts and withdrawals. It implements a multi-layered security system with 2FA enforcement, tiered approval flows, IP whitelisting, withdrawal limits, and comprehensive audit logging.

**Security Features:**
- **2FA Required**: All withdrawals require two-factor authentication
- **Tiered Approvals**: Automatic, email confirmation, or manual approval based on amount
- **IP Whitelisting**: Restrict API access to specific IP addresses or CIDR ranges
- **Withdrawal Limits**: Daily and per-transaction USD limits
- **Distributed Locking**: Prevents concurrent withdrawal race conditions
- **Audit Trail**: Complete compliance logging with never-fail pattern
- **Webhooks**: Real-time event notifications for deposits, withdrawals, and balance changes

### Setup

```typescript
import { BeepClient } from '@beep-it/sdk-core';

const beep = new BeepClient({
  apiKey: process.env.BEEP_API_KEY!, // Secret key required
});

// Access treasury module
const treasury = beep.treasury;
```

### Read-Only Operations

#### Get Treasury Info

Retrieve account balances, allocations, and total yield earned.

```typescript
const info = await beep.treasury.getTreasuryInfo();

console.log({
  totalBalanceUSD: info.totalBalanceUSD,
  totalYieldEarned: info.totalYieldEarned,
  currentAPY: info.currentAPY,
  accounts: info.accounts.map(acc => ({
    chain: acc.chain,
    token: acc.token,
    totalAmount: acc.totalAmount,
    allocatedAmount: acc.allocatedAmount,
  })),
});
```

#### Get Withdrawal Limits

Check current limits and remaining daily balance.

```typescript
const limits = await beep.treasury.getLimits();

console.log({
  dailyLimitUSD: limits.dailyLimitUSD,
  perTransactionLimitUSD: limits.perTransactionLimitUSD,
  currentDailyUsageUSD: limits.currentDailyUsageUSD,
  remainingDailyLimitUSD: limits.remainingDailyLimitUSD,
  lastResetAt: limits.lastResetAt,
});
```

#### Get Yield History

Retrieve historical yield data with snapshots.

```typescript
const yieldHistory = await beep.treasury.getYieldHistory({
  startDate: '2025-01-01',
  endDate: '2025-01-31',
});

yieldHistory.snapshots.forEach(snapshot => {
  console.log(`${snapshot.date}: ${snapshot.yieldEarned} (APY: ${snapshot.apy})`);
});
```

#### Get Transactions

Paginated transaction history for deposits and withdrawals.

```typescript
const transactions = await beep.treasury.getTransactions({
  limit: 50,
  offset: 0,
  type: 'withdrawal', // or 'deposit'
});

transactions.transactions.forEach(tx => {
  console.log(`${tx.type}: ${tx.amount} ${tx.token} - ${tx.status}`);
});
```

#### Get Allocations

Current yield generator allocations with APY.

```typescript
const allocations = await beep.treasury.getAllocations();

allocations.forEach(allocation => {
  console.log({
    protocol: allocation.protocol,
    chain: allocation.chain,
    allocatedAmount: allocation.allocatedAmount,
    currentValue: allocation.currentValue,
    yieldEarned: allocation.yieldEarned,
    apy: allocation.apy,
  });
});
```

### Withdrawal Operations

#### Creating a Withdrawal

All withdrawals require 2FA and follow tiered approval flows based on amount.

**Approval Tiers:**
- **SMALL** (<$1,000): Auto-approved with 2FA
- **MEDIUM** ($1,000-$10,000): 2FA + email confirmation required
- **LARGE** (>$10,000): 2FA + manual approval required

```typescript
// Step 1: Create withdrawal request with 2FA code
const withdrawal = await beep.treasury.createWithdrawal({
  amount: '500.00',
  chain: 'ethereum',
  token: 'USDC',
  destinationAddress: '0x1234...5678',
  twoFactorCode: '123456', // From authenticator app
});

console.log({
  withdrawalId: withdrawal.id,
  status: withdrawal.status,
  approvalRequired: withdrawal.approvalRequired,
  approvalTier: withdrawal.approvalTier,
  estimatedCompletion: withdrawal.estimatedCompletion,
});
```

#### Email Confirmation (MEDIUM Tier)

For withdrawals between $1K-$10K, email confirmation is required.

```typescript
// User receives email with confirmation token
const confirmationResult = await beep.treasury.confirmWithdrawalEmail(
  withdrawal.id,
  'email-confirmation-token-from-link',
);

console.log('Email confirmed:', confirmationResult.confirmed);
```

#### Check Withdrawal Status

Monitor withdrawal progress including approval status.

```typescript
const status = await beep.treasury.getWithdrawalStatus(withdrawal.id);

console.log({
  status: status.status,
  twoFactorVerified: status.twoFactorVerified,
  emailConfirmed: status.emailConfirmed,
  approvalStatus: status.approvalStatus,
  txHash: status.txHash,
});
```

#### Wait for Completion (Polling)

Automatically poll until withdrawal completes or times out.

```typescript
const completedWithdrawal = await beep.treasury.waitForWithdrawalCompletion(
  withdrawal.id,
  {
    timeout: 5 * 60 * 1000, // 5 minutes
    pollInterval: 5000, // Check every 5 seconds
  },
);

if (completedWithdrawal.status === 'COMPLETED') {
  console.log('Withdrawal completed! TX hash:', completedWithdrawal.txHash);
}
```

#### Cancel Withdrawal

Cancel a pending withdrawal request.

```typescript
const cancelResult = await beep.treasury.cancelWithdrawal(withdrawal.id);
console.log('Cancelled:', cancelResult.cancelled);
```

### Security Configuration

#### Update Withdrawal Limits

Self-service limit reduction (increases require admin approval).

```typescript
const updatedLimits = await beep.treasury.updateLimits({
  dailyLimitUSD: 5000, // Reduce from $10K to $5K
  perTransactionLimitUSD: 2500, // Reduce from $10K to $2.5K
});

console.log('New limits:', updatedLimits);
```

#### IP Whitelisting

Restrict API key access to specific IP addresses or CIDR ranges.

```typescript
// List current whitelisted IPs
const whitelist = await beep.treasury.listIPWhitelist();

// Add new IP to whitelist
const newEntry = await beep.treasury.addIPWhitelist({
  ipAddress: '192.168.1.100', // Or CIDR: '192.168.1.0/24'
  label: 'Office Network',
});

// Enable IP whitelisting for your API key
await beep.treasury.toggleIPWhitelist(true);

// Remove IP from whitelist
await beep.treasury.removeIPWhitelist(newEntry.id);
```

### Webhooks

Configure real-time event notifications for treasury operations.

#### Create Webhook

```typescript
const webhook = await beep.treasury.createWebhook({
  url: 'https://your-server.com/treasury-webhook',
  events: [
    'treasury.deposit',
    'treasury.withdrawal.requested',
    'treasury.withdrawal.approved',
    'treasury.withdrawal.completed',
    'treasury.withdrawal.failed',
    'treasury.balance.changed',
    'treasury.yield.earned',
  ],
  secret: 'your-webhook-secret-for-hmac-verification',
});

console.log('Webhook created:', webhook.id);
```

#### List Webhooks

```typescript
const webhooks = await beep.treasury.listWebhooks();
webhooks.forEach(wh => {
  console.log({
    id: wh.id,
    url: wh.url,
    events: wh.events,
    isActive: wh.isActive,
    lastDeliveryAt: wh.lastDeliveryAt,
  });
});
```

#### Update Webhook

```typescript
const updated = await beep.treasury.updateWebhook(webhook.id, {
  isActive: false, // Temporarily disable
  // Or update URL/events
  url: 'https://new-server.com/webhook',
  events: ['treasury.withdrawal.completed'],
});
```

#### Webhook Delivery History

```typescript
const deliveries = await beep.treasury.getWebhookDeliveries(webhook.id);
deliveries.forEach(delivery => {
  console.log({
    eventType: delivery.eventType,
    responseStatus: delivery.responseStatus,
    attempts: delivery.attempts,
    deliveredAt: delivery.deliveredAt,
    failedAt: delivery.failedAt,
  });
});
```

#### Verifying Webhook Signatures

On your server, verify webhook signatures to ensure authenticity:

```typescript
import crypto from 'crypto';

// Express webhook handler example
app.post('/treasury-webhook', (req, res) => {
  const signature = req.headers['x-beep-signature'] as string;
  const payload = JSON.stringify(req.body);

  // Verify HMAC-SHA256 signature
  const expectedSignature = crypto
    .createHmac('sha256', 'your-webhook-secret')
    .update(payload)
    .digest('hex');

  if (signature !== expectedSignature) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // Process event
  const event = req.body;
  console.log('Treasury event:', event.type, event.data);

  res.json({ received: true });
});
```

### Complete Withdrawal Flow Example

```typescript
import { BeepClient } from '@beep-it/sdk-core';

const beep = new BeepClient({ apiKey: process.env.BEEP_API_KEY! });

async function withdrawFunds() {
  try {
    // Step 1: Check current limits
    const limits = await beep.treasury.getLimits();
    console.log(`Remaining daily limit: $${limits.remainingDailyLimitUSD}`);

    // Step 2: Create withdrawal with 2FA
    const withdrawal = await beep.treasury.createWithdrawal({
      amount: '1500.00',
      chain: 'ethereum',
      token: 'USDC',
      destinationAddress: '0x1234...5678',
      twoFactorCode: '123456',
    });

    console.log('Withdrawal created:', withdrawal.id);
    console.log('Approval tier:', withdrawal.approvalTier);

    // Step 3: Handle approval based on tier
    if (withdrawal.approvalTier === 'MEDIUM') {
      console.log('Email confirmation required. Check your inbox.');
      // User clicks link in email, which includes confirmation token
      // Your webhook or frontend handles the confirmation
    } else if (withdrawal.approvalTier === 'LARGE') {
      console.log('Manual approval required. Waiting for approver...');
    } else {
      console.log('Auto-approved! Processing...');
    }

    // Step 4: Wait for completion
    const completed = await beep.treasury.waitForWithdrawalCompletion(
      withdrawal.id,
      { timeout: 10 * 60 * 1000 }, // 10 minutes
    );

    if (completed.status === 'COMPLETED') {
      console.log('✅ Withdrawal successful!');
      console.log('Transaction hash:', completed.txHash);
    }

  } catch (error) {
    console.error('Withdrawal failed:', error.message);

    // Handle specific errors
    if (error.message.includes('limit exceeded')) {
      console.log('Daily or per-transaction limit exceeded');
    } else if (error.message.includes('2FA')) {
      console.log('Invalid 2FA code');
    } else if (error.message.includes('IP')) {
      console.log('IP not whitelisted');
    }
  }
}
```

### Rate Limits

Treasury endpoints have specific rate limits:

- **Withdrawal operations**: 5 requests/minute per user
- **Read operations**: 100 requests/minute per user
- **Approval operations**: 20 requests/minute per admin

Rate limit headers are included in responses:
- `RateLimit-Limit`: Maximum requests allowed
- `RateLimit-Remaining`: Requests remaining in window
- `RateLimit-Reset`: Unix timestamp when limit resets

### Error Handling

Treasury operations may throw specific errors:

```typescript
try {
  await beep.treasury.createWithdrawal({ /* ... */ });
} catch (error) {
  // Check error type
  if (error.response?.data?.error === 'TooManyRequests') {
    const retryAfter = error.response.data.retryAfter;
    console.log(`Rate limited. Retry after ${retryAfter} seconds`);
  }

  if (error.response?.data?.error === 'WithdrawalLimitExceeded') {
    console.log('Withdrawal limit exceeded');
  }

  if (error.response?.data?.error === 'InvalidTwoFactorCode') {
    console.log('Invalid 2FA code');
  }

  if (error.response?.data?.error === 'IPWhitelistViolation') {
    console.log('IP address not whitelisted');
  }
}
```

### Best Practices

1. **Store API Keys Securely**: Never expose secret API keys in client-side code
2. **Enable IP Whitelisting**: For production, restrict API access to known IPs
3. **Set Conservative Limits**: Start with lower withdrawal limits and increase as needed
4. **Configure Webhooks**: Use webhooks for real-time notifications instead of polling
5. **Verify Webhook Signatures**: Always validate HMAC signatures on webhook endpoints
6. **Handle Rate Limits**: Implement exponential backoff for rate-limited requests
7. **Monitor Audit Logs**: Regularly review audit logs for suspicious activity
8. **Test in Staging**: Test withdrawal flows thoroughly before production use

---

## License

MIT. Go wild.
