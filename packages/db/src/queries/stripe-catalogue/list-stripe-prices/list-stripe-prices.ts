import { getDb } from '@shinefold/db/client';
import type {
  TBillingCurrency,
  TStripePriceLookupKey,
} from '@shinefold/db/constants';
import { stripePrices } from '@shinefold/db/schema/stripe-catalogue';

export type TStripePrice = {
  lookupKey: TStripePriceLookupKey;
  currency: TBillingCurrency;
  unitAmount: number;
  stripeProductId: string;
};

export async function listStripePrices(): Promise<TStripePrice[]> {
  return getDb()
    .select({
      lookupKey: stripePrices.lookupKey,
      currency: stripePrices.currency,
      unitAmount: stripePrices.unitAmount,
      stripeProductId: stripePrices.stripeProductId,
    })
    .from(stripePrices)
    .orderBy(stripePrices.lookupKey, stripePrices.currency);
}
