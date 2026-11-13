import type { TMaybeUndefined } from '@blog/config';
import {
  BILLING_CURRENCY,
  STRIPE_PRICE_LOOKUP_KEY,
  type TBillingCurrency,
} from '@blog/db/constants';
import type {
  TSaveStripePriceInput,
  TStripePriceAmount,
} from '@blog/db/queries/stripe-catalogue/save-stripe-price';
import { isOneOf } from '@blog/utils/primitives';
import { stripeIdOf } from '@platform/server/billing/stripe-id';
import type Stripe from 'stripe';

export const toBillingCurrency = (
  stripeCurrency: string,
): TMaybeUndefined<TBillingCurrency> => {
  const currency = stripeCurrency.toUpperCase();
  return isOneOf(Object.values(BILLING_CURRENCY), currency)
    ? currency
    : undefined;
};

const toAmounts = ({
  currency,
  unit_amount,
  currency_options,
}: Stripe.Price): TStripePriceAmount[] =>
  Object.entries({
    ...currency_options,
    [currency]: { unit_amount },
  }).flatMap(([stripeCurrency, { unit_amount: unitAmount }]) => {
    const billingCurrency = toBillingCurrency(stripeCurrency);
    return billingCurrency && typeof unitAmount === 'number'
      ? [{ currency: billingCurrency, unitAmount }]
      : [];
  });

export const toCataloguePrice = (
  price: Stripe.Price,
): TMaybeUndefined<TSaveStripePriceInput> => {
  const { id, active, lookup_key: lookupKey, product } = price;
  if (
    !active ||
    !lookupKey ||
    !isOneOf(Object.values(STRIPE_PRICE_LOOKUP_KEY), lookupKey)
  ) {
    return undefined;
  }

  return {
    lookupKey,
    stripePriceId: id,
    stripeProductId: stripeIdOf(product),
    amounts: toAmounts(price),
  };
};
