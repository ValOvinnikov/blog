import { BRAND_VARIANT } from '@blog/config/constants';
import {
  mockCtaButtonView,
  mockRawCtaButton,
  mockRawStatItem,
  mockRawStatsModule,
} from '@blog/service/testing/modules/fixtures';

import { toStatsModule } from './transformer';

const DESCRIPTION = 'Year over year';
const STAT_ITEMS = Array.from({ length: 6 }, (_, index) => ({
  id: `stat-${index + 1}`,
  value: `${index + 1}`,
  label: `Stat ${index + 1}`,
}));

describe(toStatsModule, () => {
  it('maps brandVariant straight through', () => {
    const raw = mockRawStatsModule({ brandVariant: BRAND_VARIANT.SECONDARY });

    const module = toStatsModule(raw);

    expect(module.brandVariant).toBe(BRAND_VARIANT.SECONDARY);
  });

  it('leaves footnote, contentAlignment and layout undefined when unset', () => {
    const raw = mockRawStatsModule({
      footnote: null,
      contentAlignment: null,
      layout: null,
    });

    const module = toStatsModule(raw);

    expect(module.footnote).toBeUndefined();
    expect(module.contentAlignment).toBeUndefined();
    expect(module.layout).toBeUndefined();
  });

  it('keeps the stats in authored order across the full 2-to-6 range', () => {
    const raw = mockRawStatsModule({
      stats: STAT_ITEMS.map(({ id, value, label }) =>
        mockRawStatItem({ _key: id, value, label }),
      ),
    });

    const module = toStatsModule(raw);

    expect(
      module.stats.map(({ id, value, label }) => ({ id, value, label })),
    ).toEqual(STAT_ITEMS);
  });

  it.each([
    [null, undefined],
    [DESCRIPTION, DESCRIPTION],
  ])('maps a stat description of %s to %s', (description, expected) => {
    const raw = mockRawStatsModule({
      stats: [mockRawStatItem({ description })],
    });

    const module = toStatsModule(raw);

    expect(module.stats[0]?.description).toBe(expected);
  });

  it('folds an empty stats array to empty', () => {
    const raw = mockRawStatsModule({ stats: [] });

    const module = toStatsModule(raw);

    expect(module.stats).toEqual([]);
  });

  it('returns an empty array for an absent ctaButtons field', () => {
    const raw = mockRawStatsModule({ ctaButtons: null });

    const module = toStatsModule(raw);

    expect(module.ctaButtons).toEqual([]);
  });

  it('maps authored ctaButtons', () => {
    const raw = mockRawStatsModule({
      ctaButtons: [mockRawCtaButton()],
    });

    const module = toStatsModule(raw);

    expect(module.ctaButtons).toEqual([mockCtaButtonView()]);
  });
});
