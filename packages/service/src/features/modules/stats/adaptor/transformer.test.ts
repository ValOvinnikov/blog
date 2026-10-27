import { BRAND_VARIANT } from '@blog/config/constants';
import {
  mockCtaButtonView,
  mockRawCtaButton,
  mockRawStatItem,
  mockRawStatsModule,
} from '@blog/service/testing/modules/fixtures';
import { faker } from '@faker-js/faker';

import { toStatsModule } from './transformer';

faker.seed(3);

const MOCK_DESCRIPTION = faker.lorem.words(2);
const MOCK_STAT_ITEMS = Array.from({ length: 6 }, () => ({
  id: faker.string.uuid(),
  value: faker.string.numeric(3),
  label: faker.lorem.words(2),
}));

describe(toStatsModule, () => {
  it('maps the brand variant', () => {
    const raw = mockRawStatsModule({ brandVariant: BRAND_VARIANT.SECONDARY });

    const module = toStatsModule(raw);

    expect(module.brandVariant).toBe(BRAND_VARIANT.SECONDARY);
  });

  it('leaves footnote, alignment and layout undefined when unset', () => {
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

  it('keeps the stats in authored order up to the maximum of six', () => {
    const raw = mockRawStatsModule({
      stats: MOCK_STAT_ITEMS.map(({ id, value, label }) =>
        mockRawStatItem({ _key: id, value, label }),
      ),
    });

    const module = toStatsModule(raw);

    expect(
      module.stats.map(({ id, value, label }) => ({ id, value, label })),
    ).toEqual(MOCK_STAT_ITEMS);
  });

  it.each([
    [null, undefined],
    [MOCK_DESCRIPTION, MOCK_DESCRIPTION],
  ])('maps a stat description of %s to %s', (description, expected) => {
    const raw = mockRawStatsModule({
      stats: [mockRawStatItem({ description })],
    });

    const module = toStatsModule(raw);

    expect(module.stats[0]?.description).toBe(expected);
  });

  it('maps an empty stats array to an empty list', () => {
    const raw = mockRawStatsModule({ stats: [] });

    const module = toStatsModule(raw);

    expect(module.stats).toEqual([]);
  });

  it('maps absent ctaButtons to an empty list', () => {
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
