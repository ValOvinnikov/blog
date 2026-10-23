import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { mockLocalizedValue } from '@blog/studio/testing/mock-documents';

import { localizedStringValues } from './localized-string-values';

const { EN, FR, NL } = LOCALE_ISO_CODES;

describe(localizedStringValues, () => {
  it('returns the filled-in value of every language', () => {
    expect(
      localizedStringValues([
        mockLocalizedValue(EN, 'About'),
        mockLocalizedValue(NL, 'Over ons'),
      ]),
    ).toEqual(['About', 'Over ons']);
  });

  it('skips languages whose value is empty or blank', () => {
    expect(
      localizedStringValues([
        mockLocalizedValue(EN, 'About'),
        mockLocalizedValue(NL, '   '),
        mockLocalizedValue(FR),
      ]),
    ).toEqual(['About']);
  });

  it('returns nothing for a field that is not set', () => {
    expect(localizedStringValues(undefined)).toEqual([]);
  });
});
