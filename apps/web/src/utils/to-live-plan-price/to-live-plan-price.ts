import {
  PRICE_PERIOD,
  type TMaybeUndefined,
  type TPricePeriod,
} from '@shinefold/config';
import {
  BILLING_CURRENCY,
  PLAN_PRICE_LOOKUP_KEYS,
  type TBillingCurrency,
} from '@shinefold/db/constants';
import type { TStripePrice } from '@shinefold/db/queries/stripe-catalogue/list-stripe-prices';
import type { TPricingTier } from '@shinefold/service';
import { isUndefined } from '@shinefold/utils/primitives';
import { isBillingCurrency } from '@web/utils/is-billing-currency';
import type { TPricingTabPeriod } from '@web/utils/to-pricing-panels';

interface IPlanPriceAmount {
  unitAmount: number;
  productId: string;
}

type TPlanPriceAmounts = Partial<Record<TBillingCurrency, IPlanPriceAmount>>;

export interface ILivePlanPrice {
  period: string;
  defaultCurrency: TBillingCurrency;
  amounts: TPlanPriceAmounts;
}

export interface IToLivePlanPriceArgs {
  tier: TPricingTier;
  tab?: TPricingTabPeriod;
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
      isBillingCurrency(currency) && !isUndefined(amounts[currency]),
  );

export const toLivePlanPrice = ({
  tier: { platformPlan },
  tab,
  planPrices,
  siteCurrency,
  periods,
}: IToLivePlanPriceArgs): TMaybeUndefined<ILivePlanPrice> => {
  if (!platformPlan) return undefined;
  const { plan, periods: planPeriods } = platformPlan;
  const period = planPeriods.find((value) => value === tab) ?? planPeriods[0];
  if (!period) return undefined;
  const { monthly, yearly } = PLAN_PRICE_LOOKUP_KEYS[plan];
  const lookupKey = period === PRICE_PERIOD.YEAR ? yearly : monthly;
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
    ? { period: periods[period], defaultCurrency, amounts }
    : undefined;
};
