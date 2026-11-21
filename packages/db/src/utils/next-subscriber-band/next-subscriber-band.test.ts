import type { TPaidSubscriberBandCeiling } from '@shinefold/db/constants';

import { nextSubscriberBand } from './next-subscriber-band';

const FIRST_BAND: TPaidSubscriberBandCeiling = 2_500;
const SECOND_BAND: TPaidSubscriberBandCeiling = 5_000;
const THIRD_BAND: TPaidSubscriberBandCeiling = 10_000;
const LARGEST_BAND: TPaidSubscriberBandCeiling = 25_000;

describe(nextSubscriberBand, () => {
  it.each([
    [null, FIRST_BAND],
    [FIRST_BAND, SECOND_BAND],
    [SECOND_BAND, THIRD_BAND],
    [THIRD_BAND, LARGEST_BAND],
  ])('moves a site on %s up to %s', (ceiling, next) => {
    expect(nextSubscriberBand(ceiling)).toBe(next);
  });

  it('offers nothing above the largest band', () => {
    expect(nextSubscriberBand(LARGEST_BAND)).toBeUndefined();
  });
});
