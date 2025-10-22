import React, { useState } from 'react';

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

interface ProductCardProps {
  product: Product;
  onAddToCart: (assetId: string, quantity: number) => void;
  onRemoveFromCart: (assetId: string) => void;
  isInCart: boolean;
}

const CART_STORAGE_KEY = 'beep_cw_cart';

const formatAmount = (amount: string, token: string): string => {
  const decimals = 6;
  const numAmount = parseInt(amount) / Math.pow(10, decimals);
  return numAmount.toFixed(6);
};

const getActivePrice = (product: Product): Price | null => {
  if (!product.prices || product.prices.length === 0) {
    return null;
  }
  return product.prices.find((p) => p.active) || null;
};

const getInitialQuantity = (assetId: string): number => {
  const stored = localStorage.getItem(CART_STORAGE_KEY);
  if (stored) {
    const cart = JSON.parse(stored) as { assetId: string; quantity: number }[];
    const item = cart.find((item) => item.assetId === assetId);
    return item ? item.quantity : 0;
  }
  return 0;
};

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  onRemoveFromCart,
  isInCart,
}) => {
  const [quantity, setQuantity] = useState(() => getInitialQuantity(product.uuid));
  const activePrice = getActivePrice(product);

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 0) {
      setQuantity(value);
    } else if (e.target.value === '') {
      setQuantity(0);
    }
  };

  const handleIncrement = () => {
    setQuantity((prev) => prev + 1);
  };

  const handleDecrement = () => {
    setQuantity((prev) => (prev > 0 ? prev - 1 : 0));
  };

  const handleAddToCart = () => {
    if (quantity > 0) {
      onAddToCart(product.uuid, quantity);
    }
  };

  const handleRemoveFromCart = () => {
    setQuantity(0);
    onRemoveFromCart(product.uuid);
  };

  return (
    <div
      style={{
        padding: '20px',
        border: '1px solid #ddd',
        borderRadius: '8px',
        backgroundColor: '#f9f9f9',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'start',
          gap: '20px',
        }}
      >
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>{product.name}</h3>
          {product.description && (
            <p style={{ margin: '0 0 10px 0', color: '#666' }}>{product.description}</p>
          )}
          <div style={{ display: 'flex', gap: '20px', fontSize: '14px', color: '#999' }}>
            <div>
              <strong>ID:</strong>{' '}
              <code
                style={{
                  backgroundColor: '#fff',
                  padding: '2px 6px',
                  borderRadius: '4px',
                }}
              >
                {product.uuid}
              </code>
            </div>
            <div>
              <strong>Token:</strong> {product.token || 'Custom'}
            </div>
            {activePrice ? (
              <div>
                <strong>Amount:</strong> {formatAmount(activePrice.amount, activePrice.token)}{' '}
                {activePrice.token}
              </div>
            ) : (
              <div style={{ color: '#e74c3c' }}>
                <strong>Price:</strong> Not available at the moment
              </div>
            )}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            alignItems: 'flex-end',
            minWidth: '200px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={handleDecrement}
              style={{
                width: '32px',
                height: '32px',
                fontSize: '18px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                backgroundColor: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              −
            </button>
            <input
              type="number"
              min="0"
              value={quantity}
              onChange={handleQuantityChange}
              style={{
                width: '60px',
                padding: '6px',
                fontSize: '14px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                textAlign: 'center',
              }}
            />
            <button
              onClick={handleIncrement}
              style={{
                width: '32px',
                height: '32px',
                fontSize: '18px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                backgroundColor: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              +
            </button>
          </div>

          <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
            <button
              onClick={handleAddToCart}
              disabled={!activePrice || quantity === 0}
              style={{
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: 'bold',
                backgroundColor: activePrice && quantity > 0 ? '#3498db' : '#ccc',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: activePrice && quantity > 0 ? 'pointer' : 'not-allowed',
                transition: 'background-color 0.2s',
                flex: 1,
              }}
              onMouseEnter={(e) => {
                if (activePrice && quantity > 0) {
                  e.currentTarget.style.backgroundColor = '#2980b9';
                }
              }}
              onMouseLeave={(e) => {
                if (activePrice && quantity > 0) {
                  e.currentTarget.style.backgroundColor = '#3498db';
                }
              }}
            >
              Add to Cart
            </button>

            <button
              onClick={handleRemoveFromCart}
              disabled={!isInCart}
              style={{
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: 'bold',
                backgroundColor: isInCart ? '#e74c3c' : '#ccc',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isInCart ? 'pointer' : 'not-allowed',
                transition: 'background-color 0.2s',
                flex: 1,
              }}
              onMouseEnter={(e) => {
                if (isInCart) {
                  e.currentTarget.style.backgroundColor = '#c0392b';
                }
              }}
              onMouseLeave={(e) => {
                if (isInCart) {
                  e.currentTarget.style.backgroundColor = '#e74c3c';
                }
              }}
            >
              Remove from Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
