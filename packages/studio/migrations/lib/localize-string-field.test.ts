import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { faker } from '@faker-js/faker';
import { at, set } from 'sanity/migrate';

import { localizeStringField } from './localize-string-field';

faker.seed(8);

const { EN } = LOCALE_ISO_CODES;

const MOCK_TEXT = faker.lorem.words();

const inEnglish = (type: string, value: unknown) => [
  { _key: EN, _type: type, language: EN, value },
];

describe(localizeStringField, () => {
  it('moves a plain string into the default language', () => {
    expect(localizeStringField('eyebrow', MOCK_TEXT)).toEqual([
      at(
        'eyebrow',
        set(inEnglish('internationalizedArrayStringValue', MOCK_TEXT)),
      ),
    ]);
  });

  it('moves a plain string into the given value type', () => {
    expect(
      localizeStringField(
        'description',
        MOCK_TEXT,
        'internationalizedArrayTextValue',
      ),
    ).toEqual([
      at(
        'description',
        set(inEnglish('internationalizedArrayTextValue', MOCK_TEXT)),
      ),
    ]);
  });

  it.each([
    ['an already localized value', [{ _key: EN }]],
    ['a missing value', undefined],
  ])('leaves %s alone', (_label, value) => {
    expect(localizeStringField('eyebrow', value)).toEqual([]);
  });
});
