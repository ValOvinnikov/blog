import { LOCALE_ISO_CODES } from '@blog/config/constants';

import { toPageLanguages } from './to-page-languages';

const { EN, NL, DE } = LOCALE_ISO_CODES;

describe(toPageLanguages, () => {
  it.each([
    {
      behaviour: 'lists the language of every page',
      pages: [{ language: EN }, { language: NL }],
      defaultLocale: EN,
      expected: [EN, NL],
    },
    {
      behaviour: 'counts a page with no language as the default language',
      pages: [{ language: null }, { language: NL }],
      defaultLocale: DE,
      expected: [DE, NL],
    },
    {
      behaviour: 'lists a language once when a legacy page shares it',
      pages: [{ language: null }, { language: EN }],
      defaultLocale: EN,
      expected: [EN],
    },
    {
      behaviour: 'is empty when there is no page',
      pages: [],
      defaultLocale: EN,
      expected: [],
    },
  ])('$behaviour', ({ pages, defaultLocale, expected }) => {
    const languages = toPageLanguages(pages, defaultLocale);

    expect(languages).toEqual(expected);
  });
});
