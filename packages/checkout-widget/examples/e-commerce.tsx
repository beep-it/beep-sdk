import { CheckoutWidget } from '@beep-it/checkout-widget';
import { useState, useEffect } from 'react';

/**
 * Real e-commerce checkout example showing integration with shopping cart
 * Demonstrates mixing existing products with dynamic pricing
 */
interface CartItem {
  productId?: string;  // For existing products
  displayName: string;
  price?: string;      // For dynamic products
  quantity: number;
}

interface ECommerceCheckoutProps {
  cartItems: CartItem[];
  merchantKey: string;
  storeName: string;
}

export function ECommerceCheckout({ cartItems, merchantKey, storeName }: ECommerceCheckoutProps) {
  const [assets, setAssets] = useState<any[]>([]);

  useEffect(() => {
    // Convert cart items to widget assets
    const widgetAssets = cartItems.map(item => {
      if (item.productId) {
        // Existing product reference
        return {
          assetId: item.productId,
          quantity: item.quantity,
          name: item.displayName
        };
      } else {
        // Dynamic product creation
        return {
          name: item.displayName,
          price: item.price!,
          quantity: item.quantity
        };
      }
    });
    setAssets(widgetAssets);
  }, [cartItems]);

  if (assets.length === 0) {
    return <div>Loading checkout...</div>;
  }

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto' }}>
      <h2>Complete Your Purchase</h2>
      <CheckoutWidget
        publishableKey={merchantKey}
        primaryColor="#3b82f6"
        labels={{
          scanQr: "Scan to complete your order",
          paymentLabel: storeName
        }}
        assets={assets}
      />
    </div>
  );
}

/**
 * Example usage of the e-commerce checkout
 */
export function ExampleUsage() {
  const cartItems: CartItem[] = [
    {
      productId: "existing-product-uuid-123",
      displayName: "Premium Coffee Beans",
      quantity: 1
    },
    {
      displayName: "Express Shipping",
      price: "9.99",
      quantity: 1
    }
  ];

  return (
    <ECommerceCheckout
      cartItems={cartItems}
      merchantKey="beep_pk_your_key_here"
      storeName="My Online Store"
    />
  );
}