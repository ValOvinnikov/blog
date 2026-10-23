import { BRAND_VARIANT } from '@blog/config';
import type { TStatItem, TStatsModule } from '@blog/service';
import { mockHeadingBlock } from '@web/testing/shared/heading-block/fixtures';

export const mockStatItem = (
  overrides: Partial<TStatItem> = {},
): TStatItem => ({
  id: 'stat-1',
  value: '2.4M',
  label: 'Monthly readers',
  description: undefined,
  ...overrides,
});

export const MOCK_STAT_ITEMS: TStatItem[] = [
  mockStatItem(),
  mockStatItem({ id: 'stat-2', value: '<50ms', label: 'Median TTFB' }),
];

export const mockStatsModule = (
  overrides: Partial<TStatsModule> = {},
): TStatsModule => ({
  brandVariant: BRAND_VARIANT.PRIMARY,
  headingBlock: mockHeadingBlock({ heading: 'By the numbers' }),
  stats: MOCK_STAT_ITEMS,
  footnote: undefined,
  ctaButtons: [],
  contentAlignment: undefined,
  layout: undefined,
  ...overrides,
});
