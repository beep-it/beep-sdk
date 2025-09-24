import { CheckoutWidget } from '@beep-it/checkout-widget';

/**
 * Service payment example
 * Perfect for consulting, freelance work, and one-time services
 */
interface ServiceCheckoutProps {
  publishableKey: string;
  serviceName: string;
  servicePrice: string;
  providerName: string;
}

export function ServiceCheckout({ publishableKey, serviceName, servicePrice, providerName }: ServiceCheckoutProps) {
  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', padding: '20px' }}>
      <h2>Pay for {serviceName}</h2>
      <p>Service provider: {providerName}</p>

      <CheckoutWidget
        publishableKey={publishableKey}
        primaryColor="#8b5cf6"
        labels={{
          scanQr: `Pay for ${serviceName}`,
          paymentLabel: `${providerName} - ${serviceName}`
        }}
        assets={[{
          name: serviceName,
          price: servicePrice,
          quantity: 1,
          description: `One-time payment for ${serviceName}`
        }]}
      />
    </div>
  );
}

/**
 * Digital product/content purchase
 * For ebooks, courses, digital downloads, etc.
 */
interface DigitalProductProps {
  publishableKey: string;
  productName: string;
  price: string;
  description: string;
}

export function DigitalProductCheckout({ publishableKey, productName, price, description }: DigitalProductProps) {
  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', padding: '20px' }}>
      <h2>Purchase {productName}</h2>
      <p>{description}</p>

      <CheckoutWidget
        publishableKey={publishableKey}
        primaryColor="#10b981"
        labels={{
          scanQr: `Buy ${productName}`,
          paymentLabel: `Digital Purchase`
        }}
        assets={[{
          name: productName,
          price: price,
          quantity: 1,
          description: description
        }]}
      />
    </div>
  );
}

/**
 * Donation widget example
 * Shows custom amount donations (one-time payments)
 */
interface DonationWidgetProps {
  cause: string;
  amount: string;
  publishableKey: string;
}

export function DonationWidget({ cause, amount, publishableKey }: DonationWidgetProps) {
  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', padding: '20px' }}>
      <h2>Support {cause}</h2>
      <p>One-time donation via stablecoin</p>

      <CheckoutWidget
        publishableKey={publishableKey}
        primaryColor="#ef4444"
        labels={{
          scanQr: `Donate $${amount}`,
          paymentLabel: `Donation - ${cause}`
        }}
        assets={[{
          name: `Donation to ${cause}`,
          price: amount,
          quantity: 1,
          description: `Support ${cause} with your donation`
        }]}
      />
    </div>
  );
}