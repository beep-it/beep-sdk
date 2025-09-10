import { SupportedToken } from './token';

/**
 * Represents a product in the BEEP payment system
 * Products define reusable payment configurations with set pricing
 */
export interface Product {
  /** Unique identifier for this product */
  id: string;
  /** UUID identifier for this product (preferred for API calls) */
  uuid: string;
  /** ID of the merchant who owns this product */
  merchantId: string;
  /** Display name for the product */
  name: string;
  /** Optional description explaining what the product is */
  description: string | null;
  /** SPL token address for payments */
  splTokenAddress: string;
  /** Token type for this product (derived from splTokenAddress) */
  token?: SupportedToken;
  /** Whether this product represents a recurring subscription */
  isSubscription: boolean;
  /** When this product was created */
  createdAt: Date;
  /** When this product was last updated */
  updatedAt: Date;
}

/**
 * Payload for creating a new product
 * Defines the pricing and configuration for a reusable payment item
 */
export interface CreateProductPayload {
  /** Display name for the product */
  name: string;
  /** Optional description of what the product provides */
  description?: string | null;
  /**
   * Price as a string in decimal format (e.g., "10.50")
   * Will be converted to base units internally
   */
  price: string;
  /**
   * Custom SPL token address (optional if token is provided)
   * @remarks Use this for tokens not in the SupportedToken enum
   */
  splTokenAddress?: string;
  /**
   * Supported token type (optional if splTokenAddress is provided)
   * @remarks Preferred over splTokenAddress when available
   */
  token?: SupportedToken;
  /**
   * Whether this product represents a subscription
   * @default false
   */
  isSubscription?: boolean;
  /**
   * Optional quantity for the product (default is 1)
   * @default 1
   */
  quantity?: number;
}

/**
 * Payload for updating an existing product
 * All fields are optional - only provided fields will be updated
 */
export interface UpdateProductPayload {
  /** New display name for the product */
  name?: string;
  /** New description (can be set to null to remove) */
  description?: string | null;
  /** New SPL token address */
  splTokenAddress?: string;
  /** New token type */
  token?: SupportedToken;
  /** Change subscription status */
  isSubscription?: boolean;
}
