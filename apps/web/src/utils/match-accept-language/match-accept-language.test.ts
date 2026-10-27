import { LOCALE_BCP47_TAGS, LOCALE_ISO_CODES } from '@blog/config';

import { matchAcceptLanguage } from './match-accept-language';

const { EN, NL, FR } = LOCALE_ISO_CODES;
const { EN: EN_TAG, NL: NL_TAG, FR: FR_TAG, DE: DE_TAG } = LOCALE_BCP47_TAGS;

describe(matchAcceptLanguage, () => {
  it.each([
    {
      case: 'picks the highest-weighted live language',
      header: `${FR_TAG};q=0.5, ${NL_TAG}-BE;q=0.9, ${EN_TAG};q=0.7`,
      live: [EN, NL, FR],
      expected: NL,
    },
    {
      case: 'matches a regional tag on its primary language',
      header: `${NL_TAG}-NL`,
      live: [EN, NL],
      expected: NL,
    },
    {
      case: 'skips languages the tenant does not serve',
      header: `${DE_TAG}, ${FR_TAG};q=0.8`,
      live: [EN, FR],
      expected: FR,
    },
    {
      case: 'keeps header order between equal weights',
      header: `${FR_TAG}, ${NL_TAG}`,
      live: [EN, NL, FR],
      expected: FR,
    },
    {
      case: 'ignores a language refused with q=0 and the wildcard',
      header: `${NL_TAG};q=0, *`,
      live: [EN, NL],
      expected: undefined,
    },
  ])('$case', ({ header, live, expected }) => {
    expect(matchAcceptLanguage(header, live)).toBe(expected);
  });

  it('is undefined without a header', () => {
    expect(matchAcceptLanguage(null, [EN, NL])).toBeUndefined();
  });
});
