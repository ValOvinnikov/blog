import 'server-only';

import type { TMaybeUndefined, TStripeAmount } from '@shinefold/config';
import type Stripe from 'stripe';

import { findOpenInvoice } from './find-open-invoice';
import { fromStripeTime } from './stripe-time';

export type TBillingAmountOwed = {
  amount: TStripeAmount;
  retryAt: TMaybeUndefined<Date>;
};

export const readAmountOwed = async (
  stripe: Stripe,
  subscription: string,
): Promise<TMaybeUndefined<TBillingAmountOwed>> => {
  const invoice = await findOpenInvoice(stripe, subscription);
  if (!invoice) return undefined;

  const { amount_remaining, currency, next_payment_attempt } = invoice;
  return {
    amount: { minorUnits: amount_remaining, currency },
    retryAt: next_payment_attempt
      ? fromStripeTime(next_payment_attempt)
      : undefined,
  };
};
