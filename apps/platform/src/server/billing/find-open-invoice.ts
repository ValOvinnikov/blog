import 'server-only';

import { STRIPE_INVOICE_STATUS } from '@platform/constants/billing';
import type { TMaybeUndefined } from '@shinefold/config';
import type Stripe from 'stripe';

export const findOpenInvoice = async (
  stripe: Stripe,
  subscription: string,
): Promise<TMaybeUndefined<Stripe.Invoice>> => {
  const { data } = await stripe.invoices.list({
    subscription,
    status: STRIPE_INVOICE_STATUS.OPEN,
    limit: 1,
  });
  return data[0];
};
