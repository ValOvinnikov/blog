import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { faker } from '@faker-js/faker';
import { at, set } from 'sanity/migrate';

import { localizeHeadingBlock } from './localize-heading-block';

faker.seed(5);

const { EN } = LOCALE_ISO_CODES;

const MOCK_HEADING = faker.lorem.words();
const MOCK_SUPPORTING_TEXT = faker.lorem.sentence();

const STRING_VALUE_TYPE = 'internationalizedArrayStringValue';
const LOCALIZED_HEADING_BLOCK_TYPE = 'localizedHeadingBlock';

const inEnglish = (type: string, value: unknown) => [
  { _key: EN, _type: type, language: EN, value },
];

describe(localizeHeadingBlock, () => {
  it('moves the heading and supporting text into the default language', () => {
    expect(
      localizeHeadingBlock({
        _type: 'headingBlock',
        heading: MOCK_HEADING,
        supportingText: MOCK_SUPPORTING_TEXT,
      }),
    ).toEqual([
      at(
        'headingBlock',
        set({
          _type: LOCALIZED_HEADING_BLOCK_TYPE,
          heading: inEnglish(STRING_VALUE_TYPE, MOCK_HEADING),
          supportingText: inEnglish(
            'internationalizedArrayTextValue',
            MOCK_SUPPORTING_TEXT,
          ),
        }),
      ),
    ]);
  });

  it('adds no supporting text to a heading block without one', () => {
    expect(
      localizeHeadingBlock({ _type: 'headingBlock', heading: MOCK_HEADING }),
    ).toEqual([
      at(
        'headingBlock',
        set({
          _type: LOCALIZED_HEADING_BLOCK_TYPE,
          heading: inEnglish(STRING_VALUE_TYPE, MOCK_HEADING),
        }),
      ),
    ]);
  });

  it('leaves an already localized heading block alone', () => {
    expect(
      localizeHeadingBlock({
        _type: LOCALIZED_HEADING_BLOCK_TYPE,
        heading: inEnglish(STRING_VALUE_TYPE, MOCK_HEADING),
      }),
    ).toEqual([]);
  });

  it('leaves a missing heading block alone', () => {
    expect(localizeHeadingBlock(undefined)).toEqual([]);
  });
});
