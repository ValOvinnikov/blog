import {
  PRICE_PERIOD,
  type TMaybeUndefined,
  type TPricePeriod,
} from '@blog/config';
import {
  BILLING_CURRENCY,
  PLAN_PRICE_LOOKUP_KEYS,
  type TBillingCurrency,
} from '@blog/db/constants';
import type { TStripePrice } from '@blog/db/queries/stripe-catalogue/list-stripe-prices';
import type { TPricingTier } from '@blog/service';
import { isOneOf, isUndefined } from '@blog/utils/primitives';

export interface IPlanPriceAmount {
  unitAmount: number;
  productId: string;
}

export type TPlanPriceAmounts = Partial<
  Record<TBillingCurrency, IPlanPriceAmount>
>;

export interface ILivePlanPrice {
  period: string;
  defaultCurrency: TBillingCurrency;
  amounts: TPlanPriceAmounts;
}

export interface IToLivePlanPriceArgs {
  tier: TPricingTier;
  planPrices: readonly TStripePrice[];
  siteCurrency: string;
  periods: Record<TPricePeriod, string>;
}

const BILLING_CURRENCIES = Object.values(BILLING_CURRENCY);

const toDefaultCurrency = (
  amounts: TPlanPriceAmounts,
  siteCurrency: string,
): TMaybeUndefined<TBillingCurrency> =>
  [siteCurrency, BILLING_CURRENCY.USD, ...BILLING_CURRENCIES].find(
    (currency): currency is TBillingCurrency =>
      isOneOf(BILLING_CURRENCIES, currency) && !isUndefined(amounts[currency]),
  );

export const toLivePlanPrice = ({
  tier: { platformPlan },
  planPrices,
  siteCurrency,
  periods,
}: IToLivePlanPriceArgs): TMaybeUndefined<ILivePlanPrice> => {
  if (!platformPlan) return undefined;
  const { plan, interval } = platformPlan;
  const { monthly, yearly } = PLAN_PRICE_LOOKUP_KEYS[plan];
  const lookupKey = interval === PRICE_PERIOD.YEAR ? yearly : monthly;
  const amounts: TPlanPriceAmounts = Object.fromEntries(
    planPrices
      .filter((price) => price.lookupKey === lookupKey)
      .map(({ currency, unitAmount, stripeProductId }) => [
        currency,
        { unitAmount, productId: stripeProductId },
      ]),
  );
  const defaultCurrency = toDefaultCurrency(amounts, siteCurrency);

  return defaultCurrency
    ? { period: periods[interval], defaultCurrency, amounts }
    : undefined;
};
