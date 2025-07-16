import { SupportedToken } from './token';

export interface Product {
  id: string;
  merchantId: string;
  name: string;
  description: string | null;
  price: string;
  splTokenAddress: string;
  token?: SupportedToken; // Optional token enum
  isSubscription: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProductPayload {
  name: string;
  description?: string | null;
  price: string;
  splTokenAddress?: string; // Optional if token is provided
  token?: SupportedToken; // Optional token enum
  isSubscription?: boolean;
}

export interface UpdateProductPayload {
  name?: string;
  description?: string | null;
  price?: string;
  splTokenAddress?: string;
  token?: SupportedToken; // Optional token enum
  isSubscription?: boolean;
}
