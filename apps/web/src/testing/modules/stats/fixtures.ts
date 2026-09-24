import { BRAND_VARIANT } from '@blog/config';
import type { TStatItem, TStatsModule } from '@blog/service';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';

export const makeStatItem = (
  overrides: Partial<TStatItem> = {},
): TStatItem => ({
  id: 'stat-1',
  value: '2.4M',
  label: 'Monthly readers',
  description: undefined,
  ...overrides,
});

export const makeStatsModule = (
  overrides: Partial<TStatsModule> = {},
): TStatsModule => ({
  brandVariant: BRAND_VARIANT.PRIMARY,
  headingBlock: makeHeadingBlock({ heading: 'By the numbers' }),
  stats: [
    makeStatItem({ id: 'stat-1', value: '2.4M', label: 'Monthly readers' }),
    makeStatItem({ id: 'stat-2', value: '<50ms', label: 'Median TTFB' }),
  ],
  footnote: undefined,
  ctaButtons: [],
  contentAlignment: undefined,
  layout: undefined,
  ...overrides,
});
