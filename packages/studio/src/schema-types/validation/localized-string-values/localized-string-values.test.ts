import { localizedStringValues } from './localized-string-values';

describe(localizedStringValues, () => {
  it('returns the filled-in value of every language', () => {
    expect(
      localizedStringValues([
        { _key: 'EN', language: 'EN', value: 'About' },
        { _key: 'NL', language: 'NL', value: 'Over ons' },
      ]),
    ).toEqual(['About', 'Over ons']);
  });

  it('skips languages whose value is empty or blank', () => {
    expect(
      localizedStringValues([
        { _key: 'EN', language: 'EN', value: 'About' },
        { _key: 'NL', language: 'NL', value: '   ' },
        { _key: 'FR', language: 'FR' },
      ]),
    ).toEqual(['About']);
  });

  it('returns nothing for a field that is not set', () => {
    expect(localizedStringValues(undefined)).toEqual([]);
  });
});
