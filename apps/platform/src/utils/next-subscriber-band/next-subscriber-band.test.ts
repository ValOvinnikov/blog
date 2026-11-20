import {
  MOCK_BAND_CEILING,
  MOCK_HIGHER_BAND_CEILING,
  MOCK_LARGEST_BAND_CEILING,
  MOCK_SECOND_LARGEST_BAND_CEILING,
} from '@platform/testing/billing/fixtures';

import { nextSubscriberBand } from './next-subscriber-band';

describe(nextSubscriberBand, () => {
  it.each([
    [null, MOCK_BAND_CEILING],
    [MOCK_BAND_CEILING, MOCK_HIGHER_BAND_CEILING],
    [MOCK_HIGHER_BAND_CEILING, MOCK_SECOND_LARGEST_BAND_CEILING],
    [MOCK_SECOND_LARGEST_BAND_CEILING, MOCK_LARGEST_BAND_CEILING],
  ])('moves a site on %s up to %s', (ceiling, next) => {
    expect(nextSubscriberBand(ceiling)).toBe(next);
  });

  it('offers nothing above the largest band', () => {
    expect(nextSubscriberBand(MOCK_LARGEST_BAND_CEILING)).toBeUndefined();
  });
});
