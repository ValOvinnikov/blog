import { LOCALE_BCP47_TAGS, LOCALE_ISO_CODES } from '@blog/config/constants';
import { getUntranslatedTargetLocales } from '@blog/studio/schema-types/inputs/localization-notice-input/untranslated-target';

const { EN, NL, FR, DE } = LOCALE_ISO_CODES;

describe(getUntranslatedTargetLocales, () => {
  it.each([
    {
      behaviour:
        'lists every live non-default language for an untranslated page',
      translated: [],
      liveLocales: [EN, NL, FR],
      expected: [NL, FR],
    },
    {
      behaviour: 'skips the languages the page is translated into',
      translated: [EN, NL],
      liveLocales: [EN, NL, FR],
      expected: [FR],
    },
    {
      behaviour: 'ignores translations into languages that are not live',
      translated: [EN, DE],
      liveLocales: [EN, NL],
      expected: [NL],
    },
    {
      behaviour: 'reports nothing for a single-language tenant',
      translated: [],
      liveLocales: [EN],
      expected: [],
    },
    {
      behaviour: 'ignores values that are not supported language codes',
      translated: [LOCALE_BCP47_TAGS.NL, null],
      liveLocales: [EN, NL],
      expected: [NL],
    },
  ])('$behaviour', ({ translated, liveLocales, expected }) => {
    expect(getUntranslatedTargetLocales(translated, liveLocales, EN)).toEqual(
      expected,
    );
  });
});
