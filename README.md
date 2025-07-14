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
import { BeepClient } from 'beep-sdk';

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

Let's say you want to charge someone $5 for a pack of 100 magic crystals in your game. Here's how you do it.

### Step 1: Ask for the Money (Create a Payment Request)

This is where you tell BEEP what you're charging for. We'll handle creating the bill and getting it ready.

```typescript
// Just describe what you're charging for in plain English.
const chargeDetails = {
  amount: 500, // IMPORTANT: Use cents. So 500 = $5.00
  currency: 'usd-spl', // This is just a fancy way of saying "digital US dollars"
  description: 'A pack of 100 magic crystals',
  payerId: 'the_user_id_who_is_paying' // The unique ID of the user you're charging
};

// Now, just tell your BEEP-Bot to request the payment.
// This creates a bill and gets everything ready behind the scenes.
const invoice = await beep.requestPayment(chargeDetails);

console.log(`Ok, we've asked for the money. The bill's ID is: ${invoice.id}`);
```

### Step 2: Get Paid!

After your user clicks the "Pay Now" button in your app, you tell BEEP to finish the job and move the money.

```typescript
// This 'try...catch' thing is just a safety net.
// It TRIES to run the code, and CATCHES any errors if something goes wrong.
try {
  // Tell your BEEP-Bot to process the payment for the invoice you just made.
  const paymentResult = await beep.payments.executePreauthorized({
    invoiceId: invoice.id
  });

  // If you see this message, you got paid! Secure the bag.
  console.log('Yesss, payment complete! Here is your receipt:', paymentResult.transactionHash);

} catch (error) {
  // If something went wrong (like their card was declined), this part will run.
  console.error('Oof. Payment failed:', error.message);
}
```

And that's literally it. You just made money.

---

## 🤓 For the Nerds (The API Deets)

If you're the type of person who reads the instruction manual, this is for you. Here are the technical specs. Everyone else, you can ignore this.

### `BeepClient`

Initializes the client. Takes an `options` object.

```typescript
new BeepClient(options: {
  apiKey: string;       // Required. Your secret API key.
  serverUrl?: string;   // Optional. For testing. Defaults to production.
})
```

**High-Level Methods:**

*   `.requestPayment(payload: RequestPaymentPayload): Promise<Invoice>` - The easy button. Creates an invoice and prepares for payment in one go.

**Low-Level Modules:**

For when you need more control.

### `beep.wallets`

*   `.create(): Promise<PrivyWallet>` - Creates a new wallet.
*   `.list(): Promise<PrivyWallet[]>` - Lists all wallets.
*   `.delete(walletId: string): Promise<void>` - Deletes a wallet.

### `beep.invoices`

*   `.create(payload: CreateInvoiceRequest): Promise<Invoice>` - Creates a new invoice.
*   `.list(): Promise<Invoice[]>` - Lists all invoices.
*   `.get(invoiceId: string): Promise<Invoice>` - Gets a single invoice.

### `beep.payments`

*   `.executePreauthorized(payload: ExecutePreauthorizedPaymentRequest): Promise<PaymentResult>` - Executes a payment.

---

## License

MIT. Go wild.
