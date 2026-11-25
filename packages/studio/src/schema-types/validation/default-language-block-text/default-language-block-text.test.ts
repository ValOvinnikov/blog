import { faker } from '@faker-js/faker';
import { LOCALE_ISO_CODES } from '@shinefold/config/constants';
import {
  getDefaultLanguage,
  setDefaultLanguage,
} from '@shinefold/studio/schema-types/validation/default-language/default-language';
import { defaultLanguageBlockText } from '@shinefold/studio/schema-types/validation/default-language-block-text/default-language-block-text';
import { mockLocalizedValue } from '@shinefold/studio/testing/mock-documents';
import { mockTextBlock } from '@shinefold/studio/testing/mock-text-block';

faker.seed(8043);

const { EN, NL } = LOCALE_ISO_CODES;

const MOCK_LEAD = faker.lorem.words(2);
const MOCK_HIGHLIGHT = faker.lorem.word();
const MOCK_TAIL = faker.lorem.words(2);
const MOCK_DUTCH_TEXT = faker.lorem.words();

describe(defaultLanguageBlockText, () => {
  const original = getDefaultLanguage();

  afterEach(() => {
    setDefaultLanguage(original);
  });

  it('joins a highlighted run to the words around it without adding spaces', () => {
    const value = [
      mockLocalizedValue(EN, [
        mockTextBlock(`${MOCK_LEAD} `, MOCK_HIGHLIGHT, ` ${MOCK_TAIL}`),
      ]),
    ];

    expect(defaultLanguageBlockText(value)).toBe(
      `${MOCK_LEAD} ${MOCK_HIGHLIGHT} ${MOCK_TAIL}`,
    );
  });

  it.each([
    ['the field is not set', undefined],
    [
      'only a non-default language has words',
      [mockLocalizedValue(NL, [mockTextBlock(MOCK_DUTCH_TEXT)])],
    ],
    [
      'the default language holds only spaces',
      [mockLocalizedValue(EN, [mockTextBlock('  ')])],
    ],
    ['the default language has no blocks', [mockLocalizedValue(EN, [])]],
  ])('is undefined when %s', (_description, value) => {
    expect(defaultLanguageBlockText(value)).toBeUndefined();
  });

  it('reads the configured default language', () => {
    setDefaultLanguage(NL);

    expect(
      defaultLanguageBlockText([
        mockLocalizedValue(EN, [mockTextBlock(MOCK_LEAD)]),
        mockLocalizedValue(NL, [mockTextBlock(MOCK_DUTCH_TEXT)]),
      ]),
    ).toBe(MOCK_DUTCH_TEXT);
  });
});
