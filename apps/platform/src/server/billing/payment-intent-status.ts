import 'server-only';

import { stripeIdOf } from '@platform/server/billing/stripe-id';
import type { TMaybeUndefined } from '@shinefold/config';
import type Stripe from 'stripe';

export const paymentIntentStatus = async (
  stripe: Stripe,
  invoice: Stripe.Invoice,
): Promise<TMaybeUndefined<Stripe.PaymentIntent.Status>> => {
  const paymentIntent = invoice.payments?.data.find(
    ({ payment }) => payment.payment_intent,
  )?.payment.payment_intent;
  if (!paymentIntent) return undefined;
  const { status } = await stripe.paymentIntents.retrieve(
    stripeIdOf(paymentIntent),
  );
  return status;
};
