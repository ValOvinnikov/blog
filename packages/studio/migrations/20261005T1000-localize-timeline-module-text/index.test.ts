import {
  mockLocalizedHeadingBlock,
  mockPlainHeadingBlock,
} from '@blog/studio/testing/migrations/localize';
import {
  mockEnglishString,
  mockInEnglish,
  mockParagraph,
} from '@blog/studio/testing/migrations/localized';
import { faker } from '@faker-js/faker';
import { at, set } from 'sanity/migrate';

import { localizeTimelineModule } from './index';

faker.seed(7);

const PARAGRAPH_TEXT_TYPE = 'internationalizedArrayParagraphTextValue';
const MOCK_HEADING = faker.lorem.words(3);
const MOCK_FIRST_KEY = faker.string.uuid();
const MOCK_SECOND_KEY = faker.string.uuid();
const MOCK_THIRD_KEY = faker.string.uuid();
const MOCK_MARKER = faker.lorem.words(2);
const MOCK_FIRST_HEADING = faker.lorem.words(2);
const MOCK_SECOND_HEADING = faker.lorem.words(2);
const MOCK_THIRD_HEADING = faker.lorem.words(2);
const MOCK_FIRST_BODY = mockParagraph();
const MOCK_THIRD_BODY = mockParagraph();

const itemPath = (key: string, field: string) => [
  'items',
  { _key: key },
  field,
];

describe(localizeTimelineModule, () => {
  it('moves the heading block and every item into the default language', () => {
    expect(
      localizeTimelineModule({
        headingBlock: mockPlainHeadingBlock(MOCK_HEADING),
        items: [
          {
            _key: MOCK_FIRST_KEY,
            marker: MOCK_MARKER,
            heading: MOCK_FIRST_HEADING,
            body: MOCK_FIRST_BODY,
          },
          { _key: MOCK_SECOND_KEY, heading: MOCK_SECOND_HEADING },
          {
            _key: MOCK_THIRD_KEY,
            heading: MOCK_THIRD_HEADING,
            body: MOCK_THIRD_BODY,
          },
        ],
      }),
    ).toEqual([
      at('headingBlock', set(mockLocalizedHeadingBlock(MOCK_HEADING))),
      at(
        itemPath(MOCK_FIRST_KEY, 'marker'),
        set(mockEnglishString(MOCK_MARKER)),
      ),
      at(
        itemPath(MOCK_FIRST_KEY, 'heading'),
        set(mockEnglishString(MOCK_FIRST_HEADING)),
      ),
      at(
        itemPath(MOCK_FIRST_KEY, 'body'),
        set(mockInEnglish(PARAGRAPH_TEXT_TYPE, MOCK_FIRST_BODY)),
      ),
      at(
        itemPath(MOCK_SECOND_KEY, 'heading'),
        set(mockEnglishString(MOCK_SECOND_HEADING)),
      ),
      at(
        itemPath(MOCK_THIRD_KEY, 'heading'),
        set(mockEnglishString(MOCK_THIRD_HEADING)),
      ),
      at(
        itemPath(MOCK_THIRD_KEY, 'body'),
        set(mockInEnglish(PARAGRAPH_TEXT_TYPE, MOCK_THIRD_BODY)),
      ),
    ]);
  });

  it('localizes only the items still holding plain text', () => {
    expect(
      localizeTimelineModule({
        items: [
          {
            _key: MOCK_FIRST_KEY,
            heading: mockEnglishString(MOCK_FIRST_HEADING),
            body: mockInEnglish(PARAGRAPH_TEXT_TYPE, MOCK_FIRST_BODY),
          },
          {
            _key: MOCK_THIRD_KEY,
            heading: mockEnglishString(MOCK_THIRD_HEADING),
            body: MOCK_THIRD_BODY,
          },
        ],
      }),
    ).toEqual([
      at(
        itemPath(MOCK_THIRD_KEY, 'body'),
        set(mockInEnglish(PARAGRAPH_TEXT_TYPE, MOCK_THIRD_BODY)),
      ),
    ]);
  });

  it.each([
    {
      name: 'an already localized module',
      doc: {
        headingBlock: mockLocalizedHeadingBlock(MOCK_HEADING),
        items: [
          {
            _key: MOCK_FIRST_KEY,
            marker: mockEnglishString(MOCK_MARKER),
            heading: mockEnglishString(MOCK_FIRST_HEADING),
            body: mockInEnglish(PARAGRAPH_TEXT_TYPE, MOCK_FIRST_BODY),
          },
        ],
      },
    },
    { name: 'a module without text', doc: {} },
  ])('leaves $name alone', ({ doc }) => {
    expect(localizeTimelineModule(doc)).toBeUndefined();
  });
});
