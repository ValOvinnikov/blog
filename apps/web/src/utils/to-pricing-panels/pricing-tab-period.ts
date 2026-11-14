import { PRICE_PERIOD, type TPricePeriod } from '@blog/config';
import type { TPricingTier } from '@blog/service';

export const PRICING_TAB_PERIODS = [
  PRICE_PERIOD.MONTH,
  PRICE_PERIOD.YEAR,
] as const;

export type TPricingTabPeriod = (typeof PRICING_TAB_PERIODS)[number];

export const isTabPeriod = (
  period: TPricePeriod,
): period is TPricingTabPeriod =>
  PRICING_TAB_PERIODS.some((tabPeriod) => tabPeriod === period);

export const periodsOf = ({
  platformPlan,
  prices,
}: TPricingTier): TPricePeriod[] =>
  platformPlan ? [platformPlan.interval] : prices.map(({ period }) => period);
