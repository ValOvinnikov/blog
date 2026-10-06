import {
  PRICE_PERIOD,
  type TMaybeUndefined,
  type TPricePeriod,
} from '@blog/config';
import type { TCtaButton, TPricingPrice, TPricingTier } from '@blog/service';
import { formatPriceAmount } from '@web/utils/format-price-amount';

const PRICING_TAB_PERIODS = [PRICE_PERIOD.MONTH, PRICE_PERIOD.YEAR] as const;

export type TPricingTabPeriod = (typeof PRICING_TAB_PERIODS)[number];

interface IPricingHeadline {
  amount: string;
  compareAt: TMaybeUndefined<{ amount: string; label: string }>;
  period: TMaybeUndefined<string>;
  prefix: TMaybeUndefined<string>;
}

export interface IPricingCardData {
  id: string;
  name: string;
  description: TMaybeUndefined<string>;
  headline: TMaybeUndefined<IPricingHeadline>;
  label: TMaybeUndefined<string>;
  extras: string[];
  features: string[];
  ctaButtons: TCtaButton[];
  highlightLabel: TMaybeUndefined<string>;
  footnote: TMaybeUndefined<string>;
}

export interface IPricingPanel {
  period: TMaybeUndefined<TPricingTabPeriod>;
  cards: IPricingCardData[];
}

export interface IPricingLabels {
  free: string;
  compareAtLabel: string;
  from: string;
  periods: Record<TPricePeriod, string>;
}

export interface IToPricingPanelsArgs {
  tiers: TPricingTier[];
  locale: string;
  currency: string;
  labels: IPricingLabels;
}

const isTabPeriod = (period: TPricePeriod): period is TPricingTabPeriod =>
  PRICING_TAB_PERIODS.some((tabPeriod) => tabPeriod === period);

export const toPricingPanels = ({
  tiers,
  locale,
  currency,
  labels,
}: IToPricingPanelsArgs): IPricingPanel[] => {
  const formatAmount = (amount: number) =>
    formatPriceAmount({ amount, locale, currency, freeLabel: labels.free });

  const toHeadline = (price: TPricingPrice): IPricingHeadline => ({
    amount: formatAmount(price.amount),
    compareAt:
      price.compareAtAmount === undefined
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
    };
  };

  const hasSwitch = PRICING_TAB_PERIODS.every((period) =>
    tiers.some((tier) => tier.prices.some((price) => price.period === period)),
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
