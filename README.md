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
npm install beep-sdk
```
This basically downloads our toolkit and puts it in your project's folder.

### Step 2: Get Your Secret Handshake (aka API Key)

An API Key is just a super long, secret password. It's how our system knows it's you. You'll find yours on your BEEP dashboard.

> **Seriously, don't share this.** It's like giving someone the keys to your house. Don't do it.

### Step 3: Wake Up the BEEP-Bot

Time to write, like, one line of code. This tells your project to start using the BEEP toolkit.

```typescript
// This line just says, "Hey, I wanna use that beep-sdk thing I just downloaded."
import { BeepClient, SupportedToken } from 'beep-sdk';

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

Let's say you want to charge someone 5 USDC for a pack of 100 magic crystals in your game. Here's how to make that money move! 💸

### Step 1: Ask for the Money

You just need to tell your BEEP-Bot how much you want to charge and in what currency. We'll generate a unique QR code and a payment link for your customer.

#### The Whole Payment Flow Explained (as if you were 5... but like, a cool 5-year-old)

1. **You call `requestPayment`** - This is literally just you telling our servers "hey, I want $X for Y reason"
2. **We create an invoice** - Think of this as a digital receipt that says "pay this amount pls"
3. **We give you back payment details** - This includes:
   - A `paymentUrl` (a link you can send to your customer)
   - A `qrCode` (same link but as a scannable QR code for mobile)
   - A `referenceKey` (a unique ID to track this specific payment)
   - An `id` (the invoice ID you can use to check payment status later)
4. **Your user pays** - They click the link or scan the code and pay using their crypto wallet
5. **We handle the crypto magic** - All the blockchain validation, token transfers, etc.
6. **You get notified** - Either through webhooks (if you set those up) or by checking the status
7. **Money lands in your account** - Cha-ching! 🤑

Seriously, all *you* need to worry about is step 1. We handle 2-7 because we're nice like that.

```typescript
// Just describe what you're charging for.
const chargeDetails = {
  // You can just use normal dollar/decimal amounts now! We handle the conversion.
  amount: 5.00,
  // We've made it easier - just use our token enum instead of that crazy address!
  token: SupportedToken.USDC, // Much cleaner than a long address, right?
  // or if you're old-school, you can still use the raw address:
  // splTokenAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // This is USDC
  description: 'A pack of 100 magic crystals',
};

try {
  // Tell your BEEP-Bot to request the payment.
  // This creates a bill and gets everything ready behind the scenes.
  const paymentDetails = await beep.requestPayment(chargeDetails);

  // Now you have everything you need to get paid!
  console.log('QR Code:', paymentDetails.qrCode);
  console.log('Payment Link:', paymentDetails.paymentUrl);

  // What you do next is up to you:
  // 1. Render the `qrCode` in your UI for the user to scan.
  // 2. Redirect the user to the `paymentUrl`.
  // BEEP will handle the rest on the backend once the user approves the transaction.

} catch (error) {
  console.error('Oof. Something went wrong creating the payment request:', error.message);
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

#### Payment Requests

```typescript
// The money maker - this is all you need 99% of the time!
const invoice = await beep.requestPayment({
  amount: 19.99, // Clean decimal amount
  token: SupportedToken.USDC, // Enum magic!
  description: 'VIP Battle Pass - Summer Season'
});

// Now you have everything you need for the user to pay
console.log('Payment URL:', invoice.paymentUrl);
console.log('Reference Key:', invoice.referenceKey);

// IMPORTANT PART: What to do with this info!
// Option 1: Redirect your user to the payment page
window.location.href = invoice.paymentUrl;

// OR Option 2: Show a QR code on your page
renderQRCode(invoice.qrCode); // Use your favorite QR library

// OR Option 3: Just give them the link
displayToUser(`Pay here: ${invoice.paymentUrl}`);

// After payment (could be seconds or minutes later):
// Check if they've paid yet
const updatedInvoice = await beep.payments.getInvoice(invoice.id);

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
console.log('Server status:', health.status); // Hopefully 'OK' 🤞
console.log('Version:', health.version);
```

**Low-Level Modules:**

For when you need more control.

### `SupportedToken`

Our shiny new enum for supported tokens! Way easier than remembering addresses.

```typescript
// Import it like this
import { SupportedToken } from 'beep-sdk';

// Use it like this
const token = SupportedToken.USDC; // Currently supported
// SupportedToken.USDT coming soon!
```

### `beep.invoices`

This is our legacy module that's now integrated into the payments module. For all invoice operations, we recommend using `beep.payments` methods instead.

```typescript
// The old way (still works but not as cool)
const invoices = await beep.invoices.list();
const invoice = await beep.invoices.get('inv_123abc');

// The new hotness - use these instead:
const invoices = await beep.payments.listInvoices();
const invoice = await beep.payments.getInvoice('inv_123abc');
```

### `beep.payments`

All your product and invoice needs - now with that sweet, sweet token enum support! 🎉

#### Creating Products

```typescript
// Creating a one-time purchase product
const product = await beep.payments.createProduct({
  name: 'Magic Sword of Destiny',
  description: 'Gives +10 attack and looks cool as heck',
  price: '9.99', // Just regular numbers as strings
  token: SupportedToken.USDC, // So much cleaner than a crazy address
  isSubscription: false // One-time purchase
});

console.log(`Created product with ID: ${product.id}`);

// Creating a subscription product
const subscriptionProduct = await beep.payments.createProduct({
  name: 'Premium Battle Pass',
  description: 'Monthly subscription with exclusive skins and perks',
  price: '14.99', // Monthly price
  token: SupportedToken.USDC,
  isSubscription: true // This makes it recurring - monthly subscription!
});

console.log(`Created subscription with ID: ${subscriptionProduct.id}`);

// Creating a metered events product (pay-as-you-go)
const meteredProduct = await beep.payments.createProduct({
  name: 'API Usage',
  description: 'Pay only for what you use - API calls',
  price: '0.001', // Price per API call
  token: SupportedToken.USDC,
  isSubscription: false,
  metadata: { // Custom metadata for metered billing
    billingType: 'metered',
    unitName: 'API call',
    meterPrecision: 0 // Integer precision for counting
  }
});

console.log(`Created metered product with ID: ${meteredProduct.id}`);
```

#### Getting a Product

```typescript
// Fetch a product by ID
const product = await beep.payments.getProduct('prod_123abc456def');
console.log(`Found product: ${product.name} for ${product.price}`);
```

#### Listing All Products

```typescript
// Get all your amazing products
const products = await beep.payments.listProducts();
console.log(`You have ${products.length} products`);

// Loop through them if you're feeling fancy
products.forEach(product => {
  console.log(`${product.name}: ${product.price} ${product.token || 'tokens'}`);
});
```

#### Updating a Product

```typescript
// Change your mind about pricing? No problemo!
const updatedProduct = await beep.payments.updateProduct('prod_123abc456def', {
  price: '14.99', // Price increase! Cha-ching!
  description: 'Now with extra sparkles ✨',
  token: SupportedToken.USDC
});

console.log('Product updated with new price:', updatedProduct.price);
```

#### Deleting a Product

```typescript
// That product is so last season - delete it!
await beep.payments.deleteProduct('prod_123abc456def');
console.log('Poof! Product deleted.');
```

#### Creating Invoices

```typescript
// Method 1: Create an invoice from a product (easiest)
const productInvoice = await beep.payments.createInvoice({
  productId: 'prod_123abc456def',
  payerType: 'customer_wallet' // Who's paying? The customer!
});

// Method 2: Create a custom invoice (for one-offs)
const customInvoice = await beep.payments.createInvoice({
  description: 'Emergency dragon-slaying services',
  amount: '49.99',
  token: SupportedToken.USDC, // Just use the enum - way cooler
  payerType: 'customer_wallet'
});

console.log(`Invoice created with ID: ${customInvoice.id}`);
```

#### Getting an Invoice

```typescript
// Look up an invoice by ID
const invoice = await beep.payments.getInvoice('inv_456def789ghi');
console.log(`Invoice for ${invoice.amount} is currently ${invoice.status}`);
```

#### Listing All Invoices

```typescript
// See all those invoices (aka future money)
const invoices = await beep.payments.listInvoices();
console.log(`You have ${invoices.length} invoices`);

// Maybe check which ones are still pending payment
const pendingInvoices = invoices.filter(inv => inv.status === 'pending');
console.log(`${pendingInvoices.length} invoices still waiting to be paid...`);
```

#### Deleting an Invoice

```typescript
// Changed your mind? Delete that invoice
await beep.payments.deleteInvoice('inv_456def789ghi');
console.log('Invoice? What invoice? It\'s gone.');
```

### `TokenUtils`

For the super nerds who want to play with token addresses:

```typescript
import { TokenUtils, SupportedToken } from 'beep-sdk';

// Get the address from a token enum
const address = TokenUtils.getTokenAddress(SupportedToken.USDC);
console.log(address); // 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'

// Check if we support a token
const isSupported = TokenUtils.isTokenSupported(SupportedToken.USDC); // true
const isUsdtSupported = TokenUtils.isTokenSupported('USDT'); // false (coming soon™)

// Get a token enum from an address (reverse lookup)
const token = TokenUtils.getTokenFromAddress('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
console.log(token); // SupportedToken.USDC

// Get the default token if none specified
const defaultToken = TokenUtils.getDefaultToken();
console.log(defaultToken); // SupportedToken.USDC
```

---

## License

MIT. Go wild.
