import { BRAND_VARIANT } from '@blog/config';
import {
  makeRawCtaButton,
  makeRawStatItem,
  makeRawStatsModule,
} from '@blog/service/testing/modules/fixtures';

import { toStatsModule } from './transformer';

describe('toStatsModule', () => {
  it('maps brandVariant straight through', () => {
    const raw = makeRawStatsModule({ brandVariant: BRAND_VARIANT.SECONDARY });

    const module = toStatsModule(raw);

    expect(module.brandVariant).toBe(BRAND_VARIANT.SECONDARY);
  });

  it('leaves footnote, contentAlignment and layout undefined when unset (no faked default)', () => {
    const raw = makeRawStatsModule({
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
    const raw = makeRawStatsModule({
      stats: [
        makeRawStatItem({ value: '1', label: 'One' }),
        makeRawStatItem({ value: '2', label: 'Two' }),
        makeRawStatItem({ value: '3', label: 'Three' }),
        makeRawStatItem({ value: '4', label: 'Four' }),
        makeRawStatItem({ value: '5', label: 'Five' }),
        makeRawStatItem({ value: '6', label: 'Six' }),
      ],
    });

    const module = toStatsModule(raw);

    expect(module.stats.map((stat) => stat.value)).toEqual([
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
    ]);
    expect(module.stats.map((stat) => stat.label)).toEqual([
      'One',
      'Two',
      'Three',
      'Four',
      'Five',
      'Six',
    ]);
  });

  it('leaves a stat description undefined when unset', () => {
    const raw = makeRawStatsModule({
      stats: [makeRawStatItem({ description: null })],
    });

    const module = toStatsModule(raw);

    expect(module.stats[0]?.description).toBeUndefined();
  });

  it('passes through an authored stat description', () => {
    const raw = makeRawStatsModule({
      stats: [makeRawStatItem({ description: 'Year over year' })],
    });

    const module = toStatsModule(raw);

    expect(module.stats[0]?.description).toBe('Year over year');
  });

  it('folds an absent stats array to empty', () => {
    const raw = makeRawStatsModule({ stats: null });

    const module = toStatsModule(raw);

    expect(module.stats).toEqual([]);
  });

  it('folds an empty stats array to empty', () => {
    const raw = makeRawStatsModule({ stats: [] });

    const module = toStatsModule(raw);

    expect(module.stats).toEqual([]);
  });

  it('returns an empty array for an absent ctaButtons field', () => {
    const raw = makeRawStatsModule({ ctaButtons: null });

    const module = toStatsModule(raw);

    expect(module.ctaButtons).toEqual([]);
  });

  it('maps authored ctaButtons', () => {
    const raw = makeRawStatsModule({
      ctaButtons: [makeRawCtaButton()],
    });

    const module = toStatsModule(raw);

    expect(module.ctaButtons).toHaveLength(1);
    expect(module.ctaButtons[0]).toMatchObject({
      link: { label: 'Subscribe', href: '/newsletter' },
    });
  });
});
