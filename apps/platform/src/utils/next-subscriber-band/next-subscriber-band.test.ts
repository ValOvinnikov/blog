import { nextSubscriberBand } from './next-subscriber-band';

describe(nextSubscriberBand, () => {
  it.each([
    [null, 2_500],
    [2_500, 5_000],
    [5_000, 10_000],
    [10_000, 25_000],
  ] as const)('moves a site on %s up to %s', (ceiling, next) => {
    expect(nextSubscriberBand(ceiling)).toBe(next);
  });

  it('offers nothing above the largest band', () => {
    expect(nextSubscriberBand(25_000)).toBeUndefined();
  });
});
