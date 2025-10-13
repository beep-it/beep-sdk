import { AxiosInstance } from 'axios';

import {
  CreateProductPayload,
  Product,
  SupportedToken,
  TokenUtils,
  UpdateProductPayload,
} from '../types';

/**
 * Module for managing products in the BEEP payment system
 * Products represent reusable payment configurations that can be used to create invoices
 * Supports both one-time purchases and recurring subscriptions
 */
export class ProductsModule {
  private client: AxiosInstance;

  constructor(client: AxiosInstance) {
    this.client = client;
  }

  /**
   * Creates a new product with the specified configuration
   * Products can be used to generate invoices with consistent pricing and metadata
   *
   * @param payload - Product creation parameters including name, price, and token information
   * @returns Promise that resolves to the created product
   * @throws {Error} When product creation fails
   *
   * @example
   * ```typescript
   * // Create a one-time purchase product
   * const product = await beep.products.createProduct({
   *   name: 'Premium License',
   *   description: 'Lifetime access to premium features',
   *   price: '99.99',
   *   token: SupportedToken.USDT,
   *   isSubscription: false
   * });
   *
   * // Create a subscription product
   * const subscription = await beep.products.createProduct({
   *   name: 'Monthly Pro Plan',
   *   description: 'Monthly subscription with full access',
   *   price: '19.99',
   *   token: SupportedToken.USDT,
   *   isSubscription: true
   * });
   * ```
   */
  async createProduct(payload: CreateProductPayload): Promise<Product> {
    const requestPayload = { ...payload };

    // Convert token enum to SPL address for API compatibility
    if (requestPayload.token && !requestPayload.splTokenAddress) {
      requestPayload.splTokenAddress = TokenUtils.getTokenAddress(requestPayload.token);
    }

    // Convert decimal price to base units for blockchain compatibility
    if (requestPayload.price) {
      const token = requestPayload.token || SupportedToken.USDC;
      const decimals = TokenUtils.getTokenDecimals(token);
      const priceValue =
        typeof requestPayload.price === 'string'
          ? parseFloat(requestPayload.price)
          : requestPayload.price;

      // Convert to base units (e.g., 0.01 USDT with 6 decimals becomes 10000)
      const priceInBaseUnits = Math.round(priceValue * 10 ** decimals);
      requestPayload.price = priceInBaseUnits.toString();
    }

    const response = await this.client.post<Product>('/v1/products', requestPayload);
    return response.data;
  }

  /**
   * Retrieves a specific product by its ID
   *
   * @param productId - The unique identifier of the product to retrieve
   * @returns Promise that resolves to the product details
   * @throws {Error} When the product is not found or retrieval fails
   *
   * @example
   * ```typescript
   * const product = await beep.products.getProduct('prod_123abc456def');
   * console.log(`Product: ${product.name} - ${product.price} ${product.token}`);
   * ```
   */
  async getProduct(productId: string): Promise<Product> {
    const response = await this.client.get<Product>(`/v1/products/${productId}`);
    return response.data;
  }

  /**
   * Retrieves all products for the current merchant
   *
   * @returns Promise that resolves to an array of products
   * @throws {Error} When product retrieval fails
   *
   * @example
   * ```typescript
   * const products = await beep.products.listProducts();
   * const subscriptions = products.filter(p => p.isSubscription);
   * console.log(`Found ${subscriptions.length} subscription products`);
   * ```
   */
  async listProducts(): Promise<Product[]> {
    const response = await this.client.get<Product[]>('/v1/products');
    return response.data;
  }

  /**
   * Updates an existing product with new configuration
   * Only provided fields will be updated - omitted fields remain unchanged
   *
   * @param productId - The unique identifier of the product to update
   * @param payload - Product update parameters (all fields optional)
   * @returns Promise that resolves to the updated product
   * @throws {Error} When the product is not found or update fails
   *
   * @example
   * ```typescript
   * // Update just the price
   * const updatedProduct = await beep.products.updateProduct('prod_123', {
   *   price: '29.99'
   * });
   *
   * // Update multiple fields
   * const updatedProduct = await beep.products.updateProduct('prod_123', {
   *   name: 'New Product Name',
   *   description: 'Updated description',
   *   price: '19.99'
   * });
   * ```
   */
  async updateProduct(productId: string, payload: UpdateProductPayload): Promise<Product> {
    const requestPayload = { ...payload };

    // Convert token enum to SPL address for API compatibility
    if (requestPayload.token && !requestPayload.splTokenAddress) {
      requestPayload.splTokenAddress = TokenUtils.getTokenAddress(requestPayload.token);
    }

    const response = await this.client.put<Product>(`/v1/products/${productId}`, requestPayload);
    return response.data;
  }

  /**
   * Deletes an existing product
   *
   * @param productId - The unique identifier of the product to delete
   * @returns Promise that resolves when the product is successfully deleted
   * @throws {Error} When the product is not found or deletion fails
   *
   * @remarks Once deleted, a product cannot be recovered. Existing invoices linked to this product will remain unaffected.
   *
   * @example
   * ```typescript
   * await beep.products.deleteProduct('prod_123abc456def');
   * console.log('Product deleted successfully');
   * ```
   */
  async deleteProduct(productId: string): Promise<void> {
    await this.client.delete(`/v1/products/${productId}`);
  }
}
