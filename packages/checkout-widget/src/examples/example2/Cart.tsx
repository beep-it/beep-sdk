import React from 'react';
import { ProductCard } from './ProductCard';

interface Price {
  id: number;
  uuid: string;
  token: string;
  chain: string;
  productId: number;
  amount: string;
  unitAmount: string;
  unitSize: number;
  unitType: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

interface Product {
  id: string;
  uuid: string;
  merchantId: string;
  name: string;
  description: string | null;
  splTokenAddress: string;
  token?: string;
  isSubscription: boolean;
  createdAt: Date;
  updatedAt: Date;
  prices?: Price[];
}

interface CartItem {
  assetId: string;
  quantity: number;
}

interface CartProps {
  cart: CartItem[];
  products: Product[];
  onAddToCart: (assetId: string, quantity: number) => void;
  onRemoveFromCart: (assetId: string) => void;
  onBackToShop: () => void;
  onProceedToPayment: () => void;
}

export const Cart: React.FC<CartProps> = ({
  cart,
  products,
  onAddToCart,
  onRemoveFromCart,
  onBackToShop,
  onProceedToPayment,
}) => {
  const cartProducts = products.filter((product) =>
    cart.some((item) => item.assetId === product.uuid),
  );

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
        My Cart
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
        {cart.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#999', fontSize: '16px', padding: '40px' }}>
            Your cart is empty. Add some products to get started!
          </div>
        ) : (
          <div>
            <div style={{ marginBottom: '20px', color: '#666' }}>
              {cart.length} item{cart.length !== 1 ? 's' : ''} in cart (
              {cart.reduce((sum, item) => sum + item.quantity, 0)} total)
            </div>
            <div style={{ display: 'grid', gap: '20px', marginBottom: '40px' }}>
              {cartProducts.map((product) => {
                const isInCart = cart.some((item) => item.assetId === product.uuid);
                return (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={onAddToCart}
                    onRemoveFromCart={onRemoveFromCart}
                    isInCart={isInCart}
                  />
                );
              })}
            </div>
          </div>
        )}

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            paddingTop: '20px',
            borderTop: '2px solid #ddd',
            marginTop: '20px',
          }}
        >
          <button
            onClick={onBackToShop}
            style={{
              padding: '12px 30px',
              fontSize: '16px',
              fontWeight: 'bold',
              backgroundColor: '#95a5a6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#7f8c8d';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#95a5a6';
            }}
          >
            Back to Shop
          </button>

          <button
            onClick={onProceedToPayment}
            disabled={cart.length === 0}
            style={{
              padding: '12px 30px',
              fontSize: '16px',
              fontWeight: 'bold',
              backgroundColor: cart.length > 0 ? '#27ae60' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: cart.length > 0 ? 'pointer' : 'not-allowed',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              if (cart.length > 0) {
                e.currentTarget.style.backgroundColor = '#229954';
              }
            }}
            onMouseLeave={(e) => {
              if (cart.length > 0) {
                e.currentTarget.style.backgroundColor = '#27ae60';
              }
            }}
          >
            Proceed to Payment
          </button>
        </div>
      </div>
    </div>
  );
};
