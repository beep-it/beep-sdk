/**
 * @fileoverview Enhanced product types with comprehensive documentation
 */

import { UUID, MoneyAmount, ISODateTime, EntityStatus } from './common';
import { SupportedToken } from './token';

/**
 * Product pricing model
 */
export enum PricingModel {
  /** One-time payment */
  ONE_TIME = 'one_time',
  /** Recurring subscription */
  SUBSCRIPTION = 'subscription',
  /** Usage-based pricing */
  USAGE_BASED = 'usage_based',
  /** Tiered pricing */
  TIERED = 'tiered',
}

/**
 * Subscription interval for recurring products
 */
export enum SubscriptionInterval {
  /** Daily subscription */
  DAILY = 'daily',
  /** Weekly subscription */
  WEEKLY = 'weekly',
  /** Monthly subscription */
  MONTHLY = 'monthly',
  /** Yearly subscription */
  YEARLY = 'yearly',
}

/**
 * Product category for organization
 */
export enum ProductCategory {
  /** Digital goods (downloads, licenses, etc.) */
  DIGITAL = 'digital',
  /** Physical products */
  PHYSICAL = 'physical',
  /** Services */
  SERVICE = 'service',
  /** Subscriptions */
  SUBSCRIPTION = 'subscription',
  /** Credits or tokens */
  CREDIT = 'credit',
  /** API access */
  API = 'api',
}

/**
 * Product creation parameters
 * @example
 * ```typescript
 * const product: CreateProductPayload = {
 *   name: 'Premium API Access',
 *   price: '99.99',
 *   token: SupportedToken.USDC,
 *   description: 'Unlimited API calls for 30 days',
 *   pricingModel: PricingModel.SUBSCRIPTION,
 *   subscriptionInterval: SubscriptionInterval.MONTHLY,
 *   category: ProductCategory.API,
 *   metadata: {
 *     features: ['unlimited-calls', 'priority-support'],
 *     rateLimit: null
 *   }
 * };
 * ```
 */
export interface CreateProductPayload {
  /**
   * Product display name
   * @minLength 1
   * @maxLength 100
   * @example "Premium Coffee Beans"
   */
  name: string;

  /**
   * Product price in decimal format
   * @pattern ^\d+(\.\d{1,2})?$
   * @example "25.50"
   */
  price: MoneyAmount;

  /**
   * Token/currency for pricing
   * @default SupportedToken.USDC
   */
  token: SupportedToken;

  /**
   * Detailed product description
   * @maxLength 1000
   */
  description?: string;

  /**
   * Short description for listings
   * @maxLength 200
   */
  shortDescription?: string;

  /**
   * Pricing model
   * @default PricingModel.ONE_TIME
   */
  pricingModel?: PricingModel;

  /**
   * Is this a subscription product?
   * @deprecated Use pricingModel instead
   */
  isSubscription?: boolean;

  /**
   * Subscription interval (required if pricingModel is SUBSCRIPTION)
   */
  subscriptionInterval?: SubscriptionInterval;

  /**
   * Product category for organization
   */
  category?: ProductCategory;

  /**
   * Product SKU for inventory tracking
   * @pattern ^[A-Z0-9-]+$
   */
  sku?: string;

  /**
   * Initial stock quantity (-1 for unlimited)
   * @default -1
   */
  stock?: number;

  /**
   * Maximum purchases per customer
   */
  maxPerCustomer?: number;

  /**
   * Product is active and purchasable
   * @default true
   */
  active?: boolean;

  /**
   * Product visibility
   * @default true
   */
  public?: boolean;

  /**
   * Product image URLs
   */
  images?: {
    /** Main product image */
    primary?: string;
    /** Additional images */
    gallery?: string[];
  };

  /**
   * Custom metadata
   */
  metadata?: Record<string, unknown>;

  /**
   * Product tags for search/filtering
   */
  tags?: string[];

  /**
   * Usage limits for usage-based products
   */
  usageLimits?: {
    /** API calls per period */
    apiCalls?: number;
    /** Storage in GB */
    storageGB?: number;
    /** Bandwidth in GB */
    bandwidthGB?: number;
    /** Custom limits */
    custom?: Record<string, number>;
  };
}

/**
 * Complete product object returned from API
 */
export interface Product extends CreateProductPayload {
  /** Unique product ID */
  id: UUID;

  /** Merchant ID who owns this product */
  merchantId: UUID;

  /** Product creation timestamp */
  createdAt: ISODateTime;

  /** Last update timestamp */
  updatedAt: ISODateTime;

  /** Product status */
  status: EntityStatus;

  /** Sales statistics */
  stats?: {
    /** Total units sold */
    totalSold: number;
    /** Total revenue generated */
    totalRevenue: MoneyAmount;
    /** Average rating (1-5) */
    averageRating?: number;
    /** Number of reviews */
    reviewCount?: number;
  };

  /** Current promotion if active */
  promotion?: {
    /** Discount percentage (0-100) */
    discountPercent: number;
    /** Discount amount */
    discountAmount?: MoneyAmount;
    /** Promotion start date */
    startsAt: ISODateTime;
    /** Promotion end date */
    endsAt: ISODateTime;
    /** Promo code required */
    code?: string;
  };
}

/**
 * Product update parameters
 * @description All fields are optional - only include fields to update
 */
export interface UpdateProductPayload extends Partial<CreateProductPayload> {
  /**
   * Update strategy for metadata
   * @default 'replace'
   */
  metadataStrategy?: 'merge' | 'replace';
}

/**
 * Product listing parameters
 */
export interface ListProductsParams {
  /** Maximum number of products to return */
  limit?: number;

  /** Number of products to skip */
  offset?: number;

  /** Filter by category */
  category?: ProductCategory;

  /** Filter by pricing model */
  pricingModel?: PricingModel;

  /** Filter by status */
  status?: EntityStatus;

  /** Include only public products */
  publicOnly?: boolean;

  /** Search query for name/description */
  search?: string;

  /** Filter by tags (any match) */
  tags?: string[];

  /** Sort field */
  sortBy?: 'name' | 'price' | 'created' | 'updated' | 'popularity';

  /** Sort order */
  sortOrder?: 'asc' | 'desc';

  /** Include products with low/no stock */
  includeOutOfStock?: boolean;

  /** Price range filter */
  priceRange?: {
    min?: number;
    max?: number;
  };
}

/**
 * Product list response
 */
export interface ProductListResponse {
  /** Array of products */
  products: Product[];

  /** Total products matching filters */
  total: number;

  /** Current page info */
  pagination: {
    limit: number;
    offset: number;
    hasMore: boolean;
  };

  /** Applied filters summary */
  filters: {
    category?: ProductCategory;
    pricingModel?: PricingModel;
    tags?: string[];
  };
}

/**
 * Bulk product operations
 */
export interface BulkProductOperation {
  /** Operation type */
  operation: 'activate' | 'deactivate' | 'delete' | 'update';

  /** Product IDs to operate on */
  productIds: UUID[];

  /** Update data (for update operation) */
  updateData?: Partial<UpdateProductPayload>;
}

/**
 * Product validation result
 */
export interface ProductValidation {
  /** Is the product data valid? */
  valid: boolean;

  /** Validation errors by field */
  errors?: Record<string, string[]>;

  /** Validation warnings */
  warnings?: string[];
}

/**
 * Validate product data before creation
 */
export function validateProduct(product: CreateProductPayload): ProductValidation {
  const errors: Record<string, string[]> = {};

  // Name validation
  if (!product.name || product.name.trim().length === 0) {
    errors.name = ['Product name is required'];
  } else if (product.name.length > 100) {
    errors.name = ['Product name must be 100 characters or less'];
  }

  // Price validation
  if (!product.price || !isValidMoneyAmount(product.price)) {
    errors.price = ['Valid price is required (e.g., "10.50")'];
  }

  // Subscription validation
  if (product.pricingModel === PricingModel.SUBSCRIPTION && !product.subscriptionInterval) {
    errors.subscriptionInterval = ['Subscription interval is required for subscription products'];
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors: Object.keys(errors).length > 0 ? errors : undefined,
  };
}

/**
 * Helper to check if a string is a valid money amount
 */
function isValidMoneyAmount(value: string): boolean {
  return /^\d+(\.\d{1,2})?$/.test(value);
}
