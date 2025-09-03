# The BEEP SDK: Turn Your Cool Sh*t into Cash 💸

Alright, let's be real. You made something awesome. A game, an app, a digital masterpiece. And now you wanna get paid for it. As you should! But dealing with payments is a whole vibe killer. That's where we come in.

## 🤔 So, like, what even *is* this?

Think of this SDK as your personal cheat code for money. It's a box of pre-written code that you can just drop into your project to handle all the boring payment stuff.

No, you don't need to know what an "SDK" is. Just know this: **this is the easy button.**

With this, you can:

*   **Give your users a "wallet"**: It's not a real wallet. It's just a secure spot online for them to keep their digital cash to pay you with. We handle all the scary security stuff.
*   **Ask for money (nicely)**: Create an "invoice," which is just a fancy word for a bill. It's like sending a Venmo request, but for your app.
*   **Actually get paid**: Process the payment and see the money roll in. Cha-ching.

Basically, we're the ✨ unpaid intern ✨ who handles your finances so you can get back to creating.

---

## 🚀 Let's Get This Bread: Your 3-Step Setup

This is probably easier than picking an Instagram filter. No cap.

### Step 1: Download the Magic

In your project's command line thingy (the black box where you type stuff), paste this:

```bash
npm install @beep/sdk-core
```
This basically downloads our toolkit and puts it in your project's folder.

### Step 2: Get Your Secret Handshake (aka API Key)

An API Key is just a super long, secret password. It's how our system knows it's you. You'll find yours on your BEEP dashboard.

> **Seriously, don't share this.** It's like giving someone the keys to your house. Don't do it.

### Step 3: Wake Up the BEEP-Bot

Time to write, like, one line of code. This tells your project to start using the BEEP toolkit.

```typescript
// This line just says, "Hey, I wanna use that beep-sdk thing I just downloaded."
import { BeepClient, SupportedToken } from '@beep/sdk-core';

// This line creates your BEEP-Bot. It's now ready for your commands.
const beep = new BeepClient({
  // Just paste that secret key you got from the dashboard right here.
  apiKey: 'your_super_secret_api_key_goes_here'
});

console.log('Ok, your BEEP-Bot is ready. Slay.');
```

Bet. You're all set up. Now for the fun part.

---

## ⚙️ How to Actually Make Money with This

Let's say you want to charge someone 5 USDT for a pack of 100 magic crystals in your game. Here's how to make that money move! 💸

### Step 1: Ask for the Money

You just need to tell your BEEP-Bot how much you want to charge and in what currency. We'll generate a unique QR code and a payment link for your customer.

#### The Whole Payment Flow Explained (as if you were 5... but like, a cool 5-year-old)

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

Seriously, all *you* need to worry about is step 1. We handle 2-7 because we're nice like that.

```typescript
// Just describe what you're charging for.
const invoiceDetails = {
  description: 'A pack of 100 magic crystals',
  amount: '5.00', // Amount as string
  token: SupportedToken.USDT, // Much cleaner than a long address, right?
  payerType: 'customer_wallet' as const, // Who's paying
};

try {
  // Tell your BEEP-Bot to create an invoice for payment.
  // This creates a bill and gets everything ready behind the scenes.
  const invoice = await beep.invoices.createInvoice(invoiceDetails);

  // Now you have everything you need to get paid!
  console.log('QR Code:', invoice.qrCode);
  console.log('Payment Link:', invoice.paymentUrl);
  console.log('Reference Key:', invoice.referenceKey);

  // What you do next is up to you:
  // 1. Render the `qrCode` in your UI for the user to scan.
  // 2. Redirect the user to the `paymentUrl`.
  // BEEP will handle the rest on the backend once the user approves the transaction.

} catch (error) {
  console.error('Oof. Something went wrong creating the invoice:', error.message);
}
```

And that's literally it. Once the user pays, the money appears in your account. You just made money.

---

## 🤓 For the true DIYers (The API Deets)

If you're the type of person who likes to take things apart just so you can put them back together, this is for you. Here are the technical specs. Everyone else, you can ignore this.

### `BeepClient`

Initializes the client. Takes an `options` object.

```typescript
new BeepClient(options: {
  apiKey: string;       // Required. Your secret API key.
  serverUrl?: string;   // Optional. For testing. Defaults to production.
})
```

**High-Level Methods:**

#### Creating Invoices for Payment

```typescript
// The money maker - create an invoice for payment!
const invoice = await beep.invoices.createInvoice({
  amount: '19.99', // Amount as string
  token: SupportedToken.USDT, // Enum magic!
  description: 'VIP Battle Pass - Summer Season',
  payerType: 'customer_wallet' // Customer pays
});

// Now you have everything you need for the user to pay
console.log('Payment URL:', invoice.paymentUrl);
console.log('Reference Key:', invoice.referenceKey);
console.log('Invoice ID:', invoice.id);

// IMPORTANT PART: What to do with this info!
// Option 1: Redirect your user to the payment page
window.location.href = invoice.paymentUrl;

// OR Option 2: Show a QR code on your page
renderQRCode(invoice.qrCode); // Use your favorite QR library

// OR Option 3: Just give them the link
displayToUser(`Pay here: ${invoice.paymentUrl}`);

// After payment (could be seconds or minutes later):
// Check if they've paid yet
const updatedInvoice = await beep.invoices.getInvoice(invoice.id);

if (updatedInvoice.status === 'paid') {
  // Woohoo! Give them their digital goodies!
  unlockAwesomeContent();
  doHappyDance();
} else if (updatedInvoice.status === 'pending') {
  // Still waiting for payment
  showSpinnyWaitingAnimation();
} else if (updatedInvoice.status === 'expired') {
  // Oof, they took too long
  showSadTromboneSound();
}
```

#### Health Check

```typescript
// Make sure our servers aren't on fire
const health = await beep.healthCheck();
console.log('Server health:', health); // Should return health status
```

**Low-Level Modules:**

For when you need more control.

### `SupportedToken`

Our shiny new enum for supported tokens! Way easier than remembering addresses.

```typescript
// Import it like this
import { SupportedToken } from '@beep/sdk-core';

// Use it like this
const token = SupportedToken.USDT; // Currently supported
// SupportedToken.USDC coming soon!
```

### `beep.invoices`

Handle invoice operations - create, retrieve, and manage payment invoices.

```typescript
// Create invoices for payment
const invoice = await beep.invoices.createInvoice({
  description: 'Premium service',
  amount: '29.99',
  token: SupportedToken.USDT,
  payerType: 'customer_wallet'
});

// Get all your invoices
const invoices = await beep.invoices.listInvoices();

// Look up a specific invoice
const invoice = await beep.invoices.getInvoice('inv_123abc');

// Delete an invoice
await beep.invoices.deleteInvoice('inv_123abc');
```

### `beep.products`

Manage your products - create reusable payment configurations with sweet token enum support! 🎉

#### Creating Products

```typescript
// Creating a one-time purchase product
const product = await beep.products.createProduct({
  name: 'Magic Sword of Destiny',
  description: 'Gives +10 attack and looks cool as heck',
  price: '9.99', // Just regular numbers as strings
  token: SupportedToken.USDT, // So much cleaner than a crazy address
  isSubscription: false // One-time purchase
});

console.log(`Created product with ID: ${product.id}`);

// Creating a subscription product
const subscriptionProduct = await beep.products.createProduct({
  name: 'Premium Battle Pass',
  description: 'Monthly subscription with exclusive skins and perks',
  price: '14.99', // Monthly price
  token: SupportedToken.USDT,
  isSubscription: true // This makes it recurring - monthly subscription!
});

console.log(`Created subscription with ID: ${subscriptionProduct.id}`);

// Creating a one-time purchase product (pay-per-use)
const oneTimeProduct = await beep.products.createProduct({
  name: 'API Usage Credit',
  description: 'Credits for API calls',
  price: '0.001', // Price per credit
  token: SupportedToken.USDT,
  isSubscription: false // One-time purchase
});

console.log(`Created one-time product with ID: ${oneTimeProduct.id}`);
```

#### Getting a Product

```typescript
// Fetch a product by ID
const product = await beep.products.getProduct('prod_123abc456def');
console.log(`Found product: ${product.name} for ${product.price}`);
```

#### Listing All Products

```typescript
// Get all your amazing products
const products = await beep.products.listProducts();
console.log(`You have ${products.length} products`);

// Loop through them if you're feeling fancy
products.forEach(product => {
  console.log(`${product.name}: ${product.price} ${product.token || 'tokens'}`);
});
```

#### Updating a Product

```typescript
// Change your mind about pricing? No problemo!
const updatedProduct = await beep.products.updateProduct('prod_123abc456def', {
  price: '14.99', // Price increase! Cha-ching!
  description: 'Now with extra sparkles ✨',
  token: SupportedToken.USDT
});

console.log('Product updated with new price:', updatedProduct.price);
```

#### Deleting a Product

```typescript
// That product is so last season - delete it!
await beep.products.deleteProduct('prod_123abc456def');
console.log('Poof! Product deleted.');
```

### `beep.payments`

Handle low-level payment operations like asset purchasing and transaction signing.

```typescript
// Request payment for assets
const payment = await beep.payments.requestAndPurchaseAsset({
  paymentReference: 'premium_subscription_123',
  assetIds: ['asset_1', 'asset_2']
});

// Sign Solana transactions directly
const signedTx = await beep.payments.signSolanaTransaction({
  senderAddress: 'sender_wallet_address',
  recipientAddress: 'recipient_wallet_address', 
  tokenMintAddress: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  amount: 1000000, // 1.0 USDT in base units
  decimals: 6
});
```

### `TokenUtils`

For the super nerds who want to play with token addresses:

```typescript
import { TokenUtils, SupportedToken } from '@beep/sdk-core';

// Get the address from a token enum
const address = TokenUtils.getTokenAddress(SupportedToken.USDT);
console.log(address); // 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'

// Check if we support a token
const isSupported = TokenUtils.isTokenSupported(SupportedToken.USDT); // true
const isUsdtSupported = TokenUtils.isTokenSupported('USDT'); // false (coming soon™)

// Get a token enum from an address (reverse lookup)
const token = TokenUtils.getTokenFromAddress('Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB');
console.log(token); // SupportedToken.USDT

// Get the default token if none specified
const defaultToken = TokenUtils.getDefaultToken();
console.log(defaultToken); // SupportedToken.USDT
```

---

## License

MIT. Go wild.
