import { CheckoutWidget } from '@beep-it/checkout-widget';

/**
 * Simplest possible integration - perfect for quick testing
 * or simple single-product checkouts
 */
export function BasicExample() {
  return (
    <CheckoutWidget
      publishableKey="beep_pk_demo"
      labels={{ scanQr: "Scan to pay" }}
      assets={[{ name: "Coffee", price: "4.99" }]}
    />
  );
}

/**
 * Basic example with custom styling and multiple products
 */
export function StyledBasicExample() {
  return (
    <CheckoutWidget
      publishableKey="beep_pk_demo"
      primaryColor="#10b981"
      labels={{
        scanQr: "Scan QR with your Solana wallet",
        paymentLabel: "Demo Coffee Shop"
      }}
      assets={[
        { name: "Espresso", price: "3.99", quantity: 2 },
        { name: "Croissant", price: "2.50", quantity: 1 }
      ]}
    />
  );
}