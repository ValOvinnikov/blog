import 'server-only';

import { STRIPE_PAYMENT_INTENT_STATUS } from '@platform/constants/stripe-payment';
import { paymentIntentStatus } from '@platform/server/billing/payment-intent-status';
import type Stripe from 'stripe';

export const invoiceAwaitsAuthentication = async (
  stripe: Stripe,
  invoiceId: string,
): Promise<boolean> => {
  const invoice = await stripe.invoices.retrieve(invoiceId, {
    expand: ['payments'],
  });
  const status = await paymentIntentStatus(stripe, invoice);
  return status === STRIPE_PAYMENT_INTENT_STATUS.REQUIRES_ACTION;
};
