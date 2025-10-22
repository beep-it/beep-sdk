/**
 * Alchemy Pay payment method codes
 * The payment methods below support USD.
 * Reference: https://alchemypay.notion.site/Payment-Methods-Coverages-Other-Details-Table-fb3b4f5c68c04b9b8619c48aad31277d
 */
export enum PayWayCode {
  VISA_MASTER_CARD = '10001', // Visa, MasterCard
  APPLE_PAY = '501',
  GOOGLE_PAY = '701',
  NETELLER = '52004',
  SKRILL = '52005',
}
