import { BeepPurchaseAsset, CreateProductPayload, Product } from '@beep-it/sdk-core';
import { useQuery } from '@tanstack/react-query';
import { useBeepClient } from './useBeepClient';

// Extended Product interface that matches actual API response with prices array
interface ProductWithPrices extends Product {
  prices?: {
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
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
  }[];
}

interface ProcessedAssetWithProduct {
  asset: BeepPurchaseAsset;
  product: ProductWithPrices;
}

interface PaymentSetupData {
  qrCode: string | null;
  referenceKey: string | null;
  paymentUrl: string | null;
  paymentLabel?: string;
  processedAssets: BeepPurchaseAsset[];
  processedAssetsWithProducts: ProcessedAssetWithProduct[];
  totalAmount: number;
}

interface UsePaymentSetupParams {
  assets: (CreateProductPayload | BeepPurchaseAsset)[];
  apiKey: string;
  serverUrl?: string;
  paymentLabel?: string;
}

export const usePaymentSetup = ({
  assets,
  apiKey,
  serverUrl,
  paymentLabel,
}: UsePaymentSetupParams) => {
  const client = useBeepClient({ apiKey, serverUrl });

  const isCreateProductPayload = (
    asset: CreateProductPayload | BeepPurchaseAsset,
  ): asset is CreateProductPayload => {
    return 'name' in asset && 'price' in asset;
  };

  // Helper function to calculate amount from product pricing
  const calculateProductAmount = (product: ProductWithPrices, quantity: number): number => {
    if (product.prices && product.prices.length > 0) {
      const price = product.prices[0]; // Use first price entry
      // Convert from base units (6 decimals) back to dollars for display
      // e.g., "9990000" -> 9.99
      const unitAmountInBaseUnits = parseFloat(price.amount);
      const unitAmount = unitAmountInBaseUnits / 10 ** 6; // Convert from base units to dollars
      return unitAmount * quantity;
    }
    return 0;
  };

  const processAssets = async (): Promise<{
    processedAssets: BeepPurchaseAsset[];
    processedAssetsWithProducts: ProcessedAssetWithProduct[];
    totalAmount: number;
  }> => {
    const processedAssets: BeepPurchaseAsset[] = [];
    const processedAssetsWithProducts: ProcessedAssetWithProduct[] = [];
    let totalAmount = 0;

    for (const asset of assets) {
      let product: ProductWithPrices;
      let quantity: number;
      let productName: string;

      if (isCreateProductPayload(asset)) {
        try {
          // Convert input price to base units for comparison (same as createProduct does)
          const priceValue =
            typeof asset.price === 'string' ? parseFloat(asset.price) : asset.price;
          const priceInBaseUnits = Math.round(priceValue * 10 ** 6); // USDT has 6 decimals
          const priceInBaseUnitsString = priceInBaseUnits.toString();

          // first check if product with same name and price already exists to avoid duplicates
          const existingProducts: ProductWithPrices[] = await client.products.listProducts();
          const matchedProduct = existingProducts.find(
            (p) =>
              p.name === asset.name &&
              p.prices?.some((price) => price.amount === priceInBaseUnitsString),
          );
          if (matchedProduct) {
            product = matchedProduct as ProductWithPrices;
            quantity = asset.quantity || 1; // Default quantity for existing products
            productName = asset.name;
          } else {
            // Create product if it doesn't exist
            product = (await client.products.createProduct(asset)) as ProductWithPrices;
            quantity = asset.quantity || 1; // Default quantity for new products
            productName = asset.name;
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? `Failed to create product "${asset.name}": ${error.message}`
              : `Failed to create product "${asset.name}": Unknown error`;
          throw new Error(errorMessage);
        }
      } else {
        product = (await client.products.getProduct(asset.assetId)) as ProductWithPrices;
        quantity = asset.quantity;
        productName = product.name;
      }

      const assetData = { assetId: product.uuid, quantity };

      processedAssets.push(assetData);
      processedAssetsWithProducts.push({ asset: assetData, product });

      // Calculate and add amount to total
      totalAmount += calculateProductAmount(product, quantity);
    }

    return { processedAssets, processedAssetsWithProducts, totalAmount };
  };

  return useQuery<PaymentSetupData>({
    queryKey: ['payment-setup', JSON.stringify(assets), apiKey, serverUrl],
    queryFn: async () => {
      const { processedAssets, processedAssetsWithProducts, totalAmount } = await processAssets();

      const paymentResponse = await client.payments.requestAndPurchaseAsset({
        assets: processedAssets,
        generateQrCode: true,
        paymentLabel,
      });

      return {
        qrCode: paymentResponse?.qrCode || null,
        referenceKey: paymentResponse?.referenceKey || null,
        paymentUrl: paymentResponse?.paymentUrl || null,
        processedAssets,
        processedAssetsWithProducts,
        totalAmount,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
};
