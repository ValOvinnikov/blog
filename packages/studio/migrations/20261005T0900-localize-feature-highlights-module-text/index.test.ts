import {
  mockImageAsset,
  mockLocalizedHeadingBlock,
  mockLocalizedImage,
  mockPlainHeadingBlock,
  mockPlainImage,
} from '@blog/studio/testing/migrations/localize';
import {
  mockEnglishString,
  mockInEnglish,
  mockParagraph,
} from '@blog/studio/testing/migrations/localized';
import { faker } from '@faker-js/faker';
import { at, set } from 'sanity/migrate';

import { localizeFeatureHighlightsModule } from './index';

faker.seed(6);

const LISTED_TEXT_TYPE = 'internationalizedArrayListedTextValue';
const MOCK_HEADING = faker.lorem.words(3);
const MOCK_ASSET = mockImageAsset();
const MOCK_FIRST_KEY = faker.string.uuid();
const MOCK_SECOND_KEY = faker.string.uuid();
const MOCK_FIRST_HEADING = faker.lorem.words(2);
const MOCK_SECOND_HEADING = faker.lorem.words(2);
const MOCK_FIRST_BODY = mockParagraph();
const MOCK_SECOND_BODY = mockParagraph();
const MOCK_FIRST_ALT = faker.lorem.words(2);
const MOCK_SECOND_ALT = faker.lorem.words(2);

const rowPath = (key: string, field: string) => [
  'highlights',
  { _key: key },
  field,
];

describe(localizeFeatureHighlightsModule, () => {
  it('moves the heading block and every row into the default language', () => {
    expect(
      localizeFeatureHighlightsModule({
        headingBlock: mockPlainHeadingBlock(MOCK_HEADING),
        highlights: [
          {
            _key: MOCK_FIRST_KEY,
            heading: MOCK_FIRST_HEADING,
            body: MOCK_FIRST_BODY,
            image: mockPlainImage(MOCK_ASSET, MOCK_FIRST_ALT),
          },
          {
            _key: MOCK_SECOND_KEY,
            heading: MOCK_SECOND_HEADING,
            body: MOCK_SECOND_BODY,
            image: mockPlainImage(MOCK_ASSET, MOCK_SECOND_ALT),
          },
        ],
      }),
    ).toEqual([
      at('headingBlock', set(mockLocalizedHeadingBlock(MOCK_HEADING))),
      at(
        rowPath(MOCK_FIRST_KEY, 'heading'),
        set(mockEnglishString(MOCK_FIRST_HEADING)),
      ),
      at(
        rowPath(MOCK_FIRST_KEY, 'body'),
        set(mockInEnglish(LISTED_TEXT_TYPE, MOCK_FIRST_BODY)),
      ),
      at(
        rowPath(MOCK_FIRST_KEY, 'image'),
        set(mockLocalizedImage(MOCK_ASSET, MOCK_FIRST_ALT)),
      ),
      at(
        rowPath(MOCK_SECOND_KEY, 'heading'),
        set(mockEnglishString(MOCK_SECOND_HEADING)),
      ),
      at(
        rowPath(MOCK_SECOND_KEY, 'body'),
        set(mockInEnglish(LISTED_TEXT_TYPE, MOCK_SECOND_BODY)),
      ),
      at(
        rowPath(MOCK_SECOND_KEY, 'image'),
        set(mockLocalizedImage(MOCK_ASSET, MOCK_SECOND_ALT)),
      ),
    ]);
  });

  it('localizes only the rows still holding plain text', () => {
    expect(
      localizeFeatureHighlightsModule({
        highlights: [
          {
            _key: MOCK_FIRST_KEY,
            heading: mockEnglishString(MOCK_FIRST_HEADING),
            image: mockLocalizedImage(MOCK_ASSET, MOCK_FIRST_ALT),
          },
          {
            _key: MOCK_SECOND_KEY,
            heading: MOCK_SECOND_HEADING,
            image: mockLocalizedImage(MOCK_ASSET, MOCK_SECOND_ALT),
          },
        ],
      }),
    ).toEqual([
      at(
        rowPath(MOCK_SECOND_KEY, 'heading'),
        set(mockEnglishString(MOCK_SECOND_HEADING)),
      ),
    ]);
  });

  it.each([
    {
      name: 'an already localized module',
      doc: {
        headingBlock: mockLocalizedHeadingBlock(MOCK_HEADING),
        highlights: [
          {
            _key: MOCK_FIRST_KEY,
            heading: mockEnglishString(MOCK_FIRST_HEADING),
            body: mockInEnglish(LISTED_TEXT_TYPE, MOCK_FIRST_BODY),
            image: mockLocalizedImage(MOCK_ASSET, MOCK_FIRST_ALT),
          },
        ],
      },
    },
    { name: 'a module without text', doc: {} },
  ])('leaves $name alone', ({ doc }) => {
    expect(localizeFeatureHighlightsModule(doc)).toBeUndefined();
  });
});
