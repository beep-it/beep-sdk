import { PayWayCode } from '../../core/src/types/cash-payment';

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
