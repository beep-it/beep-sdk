import { PayWayCode } from '../../core/src/types/cash-payment';
import visaMasterCardLogo from './visa-mastercard.svg';
import applePayLogo from './apple-pay.svg';
import googlePayLogo from './google-pay.svg';
import netellerLogo from './neteller.svg';
import skrillLogo from './skrill.svg';

export enum WidgetSteps {
  PaymentInterface = 'PAYMENT_INTERFACE',
  EmailVerification = 'EMAIL_VERIFICATION',
  CodeConfirmation = 'CODE_CONFIRMATION',
  PaymentQuote = 'PAYMENT_QUOTE',
  PaymentSuccess = 'PAYMENT_SUCCESS',
  PaymentFailure = 'PAYMENT_FAILURE',
}

export const PAY_WAY_CODE_LABELS: Record<PayWayCode, string> = {
  [PayWayCode.VISA_MASTER_CARD]: 'Visa / MasterCard',
  [PayWayCode.APPLE_PAY]: 'Apple Pay',
  [PayWayCode.GOOGLE_PAY]: 'Google Pay',
  [PayWayCode.NETELLER]: 'Neteller',
  [PayWayCode.SKRILL]: 'Skrill',
};

export const PAY_WAY_CODE_LOGOS: Record<PayWayCode, string> = {
  [PayWayCode.VISA_MASTER_CARD]: visaMasterCardLogo,
  [PayWayCode.APPLE_PAY]: applePayLogo,
  [PayWayCode.GOOGLE_PAY]: googlePayLogo,
  [PayWayCode.NETELLER]: netellerLogo,
  [PayWayCode.SKRILL]: skrillLogo,
};
