import type { TMaybeUndefined, TPricePeriod } from '@blog/config';
import type { TCtaButton } from '@blog/service';
import type { ILivePlanPrice } from '@web/utils/to-live-plan-price';

import type { TPricingTabPeriod } from './pricing-tab-period';

export interface IPricingHeadline {
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
  livePrice: TMaybeUndefined<ILivePlanPrice>;
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
