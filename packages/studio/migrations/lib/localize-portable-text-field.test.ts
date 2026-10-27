import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { faker } from '@faker-js/faker';
import { at, set } from 'sanity/migrate';

import { localizePortableTextField } from './localize-portable-text-field';

faker.seed(7);

const { EN } = LOCALE_ISO_CODES;

const LISTED_TEXT_VALUE_TYPE = 'internationalizedArrayListedTextValue';
const MOCK_BLOCKS = [
  { _type: 'block', _key: faker.string.uuid(), children: [] },
];

const inEnglish = (type: string, value: unknown) => [
  { _key: EN, _type: type, language: EN, value },
];

describe(localizePortableTextField, () => {
  it('moves plain Portable Text into the default language', () => {
    expect(localizePortableTextField('content', MOCK_BLOCKS)).toEqual([
      at('content', set(inEnglish(LISTED_TEXT_VALUE_TYPE, MOCK_BLOCKS))),
    ]);
  });

  it.each([
    [
      'an already localized value',
      inEnglish(LISTED_TEXT_VALUE_TYPE, MOCK_BLOCKS),
    ],
    ['an empty value', []],
    ['a missing value', undefined],
  ])('leaves %s alone', (_label, value) => {
    expect(localizePortableTextField('content', value)).toEqual([]);
  });

  it('moves plain Portable Text into the given localized value type', () => {
    expect(
      localizePortableTextField(
        'body',
        MOCK_BLOCKS,
        'internationalizedArrayParagraphTextValue',
      ),
    ).toEqual([
      at(
        'body',
        set(inEnglish('internationalizedArrayParagraphTextValue', MOCK_BLOCKS)),
      ),
    ]);
  });

  it('moves Portable Text with embedded objects into the default language', () => {
    const article = [
      ...MOCK_BLOCKS,
      {
        _type: 'bodyImage',
        _key: faker.string.uuid(),
        alt: faker.lorem.words(),
      },
    ];

    expect(
      localizePortableTextField(
        'body',
        article,
        'internationalizedArrayArticleTextValue',
      ),
    ).toEqual([
      at(
        'body',
        set(inEnglish('internationalizedArrayArticleTextValue', article)),
      ),
    ]);
  });
});
