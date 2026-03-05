import React, { useEffect, useState } from 'react';
import { useBeepPublicClient } from '../hooks/useBeepPublicClient';
import { ProductCard } from './example2/ProductCard';
import { Cart } from './example2/Cart';
import { Payment } from './example2/Payment';
import { ProductWithPrices } from '@beep-it/sdk-core';

interface CartItem {
  assetId: string;
  quantity: number;
}

interface Example2Props {
  publishableKey: string;
}

type View = 'shop' | 'cart' | 'payment';

const CART_STORAGE_KEY = 'beep_cw_cart';

export const Example2: React.FC<Example2Props> = ({ publishableKey }) => {
  const [products, setProducts] = useState<ProductWithPrices[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<View>('shop');
  const [cart, setCart] = useState<CartItem[]>(() => {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  const beepClient = useBeepPublicClient({ publishableKey, serverUrl: 'http://localhost:4070' });

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await beepClient.widget.getProducts();
        setProducts(response.products);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch products');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [beepClient]);

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  const handleAddToCart = (assetId: string, quantity: number) => {
    setCart((prevCart) => {
      const existingItemIndex = prevCart.findIndex((item) => item.assetId === assetId);

      if (existingItemIndex >= 0) {
        // Update existing item
        const newCart = [...prevCart];
        newCart[existingItemIndex] = {
          assetId,
          quantity: newCart[existingItemIndex].quantity + quantity,
        };
        return newCart;
      } else {
        // Add new item
        return [...prevCart, { assetId, quantity }];
      }
    });
  };

  const handleRemoveFromCart = (assetId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.assetId !== assetId));
  };

  if (view === 'cart') {
    return (
      <Cart
        cart={cart}
        products={products}
        onAddToCart={handleAddToCart}
        onRemoveFromCart={handleRemoveFromCart}
        onBackToShop={() => setView('shop')}
        onProceedToPayment={() => setView('payment')}
      />
    );
  }

  if (view === 'payment') {
    return (
      <Payment cart={cart} publishableKey={publishableKey} onBackToCart={() => setView('cart')} />
    );
  }

  return (
    <div
      style={{
        padding: '40px',
        fontFamily: 'Arial, sans-serif',
        backgroundColor: '#f5f5f5',
        minHeight: '100vh',
      }}
    >
      <h2
        style={{
          textAlign: 'center',
          marginBottom: '40px',
          color: '#333',
        }}
      >
        Example 2 - Products List
      </h2>

      <div
        style={{
          padding: '40px',
          backgroundColor: 'white',
          borderRadius: '8px',
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        {loading && (
          <div style={{ textAlign: 'center', color: '#666', fontSize: '16px' }}>
            Loading products...
          </div>
        )}

        {error && (
          <div style={{ textAlign: 'center', color: '#e74c3c', fontSize: '16px' }}>
            Error: {error}
          </div>
        )}

        {!loading && !error && products.length === 0 && (
          <div style={{ textAlign: 'center', color: '#999', fontSize: '16px' }}>
            No products found. Create some products using the API.
          </div>
        )}

        {!loading && !error && products.length > 0 && (
          <div>
            <div style={{ marginBottom: '20px', color: '#666' }}>
              Found {products.length} product{products.length !== 1 ? 's' : ''}
              {cart.length > 0 && (
                <span
                  onClick={() => setView('cart')}
                  style={{
                    marginLeft: '20px',
                    color: '#3498db',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  My Cart: {cart.reduce((sum, item) => sum + item.quantity, 0)} item
                  {cart.reduce((sum, item) => sum + item.quantity, 0) !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            <div style={{ display: 'grid', gap: '20px' }}>
              {products.map((product) => {
                const isInCart = cart.some((item) => item.assetId === product.uuid);
                return (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={handleAddToCart}
                    onRemoveFromCart={handleRemoveFromCart}
                    isInCart={isInCart}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
