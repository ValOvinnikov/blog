import { LOCALE_ISO_CODES } from '@blog/config/constants';
import {
  collectMissingLocales,
  getMissingLocales,
  getMissingTranslations,
} from '@blog/studio/schema-types/inputs/localization-notice-input/missing-locales';
import { mockLocalizedValue } from '@blog/studio/testing/mock-documents';
import { faker } from '@faker-js/faker';

faker.seed(4102);

const { EN, NL, FR } = LOCALE_ISO_CODES;

const LOCALIZED_STRING_VALUE_TYPE = 'internationalizedArrayStringValue';
const CASE_TITLE = '$behaviour';
const BLANK_TEXT = '  ';
const MOCK_TEXT = faker.lorem.word();
const MOCK_TRANSLATED_TEXT = faker.lorem.word();
const MOCK_PLAIN_TITLE = faker.lorem.words(2);
const MOCK_BLOCK = { _type: 'block', children: [] };

const mockLocalizedItem = (language: string, value: unknown) => ({
  ...mockLocalizedValue(language, value),
  _type: LOCALIZED_STRING_VALUE_TYPE,
});

describe(getMissingLocales, () => {
  it.each([
    {
      behaviour: 'lists every live language without a value',
      value: [mockLocalizedItem(EN, MOCK_TEXT)],
      liveLocales: [EN, NL, FR],
      expected: [NL, FR],
    },
    {
      behaviour: 'treats a blank value as missing',
      value: [
        mockLocalizedItem(EN, MOCK_TEXT),
        mockLocalizedItem(NL, BLANK_TEXT),
      ],
      liveLocales: [EN, NL],
      expected: [NL],
    },
    {
      behaviour: 'treats empty formatted text as missing',
      value: [mockLocalizedItem(EN, [MOCK_BLOCK]), mockLocalizedItem(NL, [])],
      liveLocales: [EN, NL],
      expected: [NL],
    },
    {
      behaviour: 'reports every live language for an empty field',
      value: undefined,
      liveLocales: [EN, NL],
      expected: [EN, NL],
    },
    {
      behaviour: 'ignores languages that are not live',
      value: [
        mockLocalizedItem(EN, MOCK_TEXT),
        mockLocalizedItem(FR, MOCK_TRANSLATED_TEXT),
      ],
      liveLocales: [EN],
      expected: [],
    },
  ])(CASE_TITLE, ({ value, liveLocales, expected }) => {
    expect(getMissingLocales(value, liveLocales)).toEqual(expected);
  });
});

describe(getMissingTranslations, () => {
  it.each([
    {
      behaviour: 'lists the languages a partly translated field is missing',
      value: [mockLocalizedItem(EN, MOCK_TEXT)],
      liveLocales: [EN, NL, FR],
      expected: [NL, FR],
    },
    {
      behaviour: 'reports nothing for a field left empty in every language',
      value: undefined,
      liveLocales: [EN, NL],
      expected: [],
    },
    {
      behaviour: 'reports nothing for a field whose every language is blank',
      value: [mockLocalizedItem(EN, ''), mockLocalizedItem(NL, BLANK_TEXT)],
      liveLocales: [EN, NL],
      expected: [],
    },
    {
      behaviour: 'lists the default language when only a translation is filled',
      value: [mockLocalizedItem(NL, MOCK_TRANSLATED_TEXT)],
      liveLocales: [EN, NL],
      expected: [EN],
    },
  ])(CASE_TITLE, ({ value, liveLocales, expected }) => {
    expect(getMissingTranslations(value, liveLocales)).toEqual(expected);
  });
});

describe(collectMissingLocales, () => {
  it.each([
    {
      behaviour:
        'collects missing languages across nested fields, in live order',
      document: {
        _type: 'module_cta',
        heading: [
          mockLocalizedItem(EN, MOCK_TEXT),
          mockLocalizedItem(NL, MOCK_TRANSLATED_TEXT),
        ],
        buttons: [
          {
            _type: 'button',
            label: [
              mockLocalizedItem(EN, MOCK_TEXT),
              mockLocalizedItem(FR, MOCK_TRANSLATED_TEXT),
            ],
          },
        ],
      },
      liveLocales: [EN, NL, FR],
      expected: [NL, FR],
    },
    {
      behaviour: 'reports nothing for a document without localized fields',
      document: { _type: 'page', title: MOCK_PLAIN_TITLE },
      liveLocales: [EN, NL],
      expected: [],
    },
    {
      behaviour: 'ignores a localized field left empty in every language',
      document: {
        _type: 'module_heroStatement',
        heading: [
          mockLocalizedItem(EN, MOCK_TEXT),
          mockLocalizedItem(NL, MOCK_TRANSLATED_TEXT),
        ],
        supportingText: [mockLocalizedItem(EN, ''), mockLocalizedItem(NL, '')],
      },
      liveLocales: [EN, NL],
      expected: [],
    },
    {
      behaviour: 'never lists the default language',
      document: {
        _type: 'module_cta',
        heading: [mockLocalizedItem(EN, MOCK_TEXT)],
        label: [mockLocalizedItem(NL, MOCK_TRANSLATED_TEXT)],
      },
      liveLocales: [EN, NL],
      expected: [NL],
    },
  ])(CASE_TITLE, ({ document, liveLocales, expected }) => {
    expect(collectMissingLocales(document, liveLocales, EN)).toEqual(expected);
  });
});
