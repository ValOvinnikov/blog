import type { TMaybeUndefined } from '@blog/config';
import type { TStripePrice } from '@blog/db/queries/stripe-catalogue/list-stripe-prices';
import type { TPricingPrice, TPricingTier } from '@blog/service';
import { isUndefined } from '@blog/utils/primitives';
import { formatPriceAmount } from '@web/utils/format-price-amount';
import { toLivePlanPrice } from '@web/utils/to-live-plan-price';

import type {
  IPricingCardData,
  IPricingHeadline,
  IPricingLabels,
  IPricingPanel,
} from './pricing-panel';
import {
  isTabPeriod,
  periodsOf,
  PRICING_TAB_PERIODS,
  type TPricingTabPeriod,
} from './pricing-tab-period';

export interface IToPricingPanelsArgs {
  tiers: TPricingTier[];
  planPrices: readonly TStripePrice[];
  locale: string;
  currency: string;
  labels: IPricingLabels;
}

export const toPricingPanels = ({
  tiers,
  planPrices,
  locale,
  currency,
  labels,
}: IToPricingPanelsArgs): IPricingPanel[] => {
  const formatAmount = (amount: number) =>
    formatPriceAmount({ amount, locale, currency, freeLabel: labels.free });

  const toHeadline = (price: TPricingPrice): IPricingHeadline => ({
    amount: formatAmount(price.amount),
    compareAt: isUndefined(price.compareAtAmount)
      ? undefined
      : {
          amount: formatAmount(price.compareAtAmount),
          label: labels.compareAtLabel,
        },
    period: price.amount === 0 ? undefined : labels.periods[price.period],
    prefix: price.isStartingAt ? labels.from : undefined,
  });

  const toExtra = (price: TPricingPrice): string => {
    const { prefix, amount, period } = toHeadline(price);
    return [prefix, amount, period].filter(Boolean).join(' ');
  };

  const toCard = (
    tier: TPricingTier,
    tab: TMaybeUndefined<TPricingTabPeriod>,
  ): IPricingCardData => {
    const hasTabPrice = tier.prices.some((price) => price.period === tab);
    const prices =
      tab && hasTabPrice
        ? tier.prices.filter(
            (price) => price.period === tab || !isTabPeriod(price.period),
          )
        : tier.prices;
    const head = prices.find((price) => price.period === tab) ?? prices[0];

    return {
      id: tier.id,
      name: tier.name,
      description: tier.description,
      headline: head ? toHeadline(head) : undefined,
      label: tier.priceLabel,
      extras: prices.filter((price) => price !== head).map(toExtra),
      features: tier.features,
      ctaButtons: tier.ctaButtons,
      highlightLabel: tier.highlightLabel,
      footnote: tier.footnote,
      livePrice: toLivePlanPrice({
        tier,
        planPrices,
        siteCurrency: currency,
        periods: labels.periods,
      }),
    };
  };

  const hasSwitch = PRICING_TAB_PERIODS.every((period) =>
    tiers.some((tier) => periodsOf(tier).includes(period)),
  );

  if (!hasSwitch) {
    return [
      {
        period: undefined,
        cards: tiers.map((tier) => toCard(tier, undefined)),
      },
    ];
  }

  return PRICING_TAB_PERIODS.map((period) => ({
    period,
    cards: tiers.map((tier) => toCard(tier, period)),
  }));
};
