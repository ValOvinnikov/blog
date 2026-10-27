import {
  mockLocalizedHeadingBlock,
  mockPlainHeadingBlock,
} from '@blog/studio/testing/migrations/localize';
import { mockEnglishString } from '@blog/studio/testing/migrations/localized';
import { faker } from '@faker-js/faker';
import { at, set } from 'sanity/migrate';

import { localizeStatsModule } from './index';

faker.seed(5);

const MOCK_HEADING = faker.lorem.words(3);
const MOCK_SUPPORTING_TEXT = faker.lorem.sentence();
const MOCK_FOOTNOTE = faker.lorem.sentence();
const MOCK_FIRST_KEY = faker.string.uuid();
const MOCK_SECOND_KEY = faker.string.uuid();
const MOCK_THIRD_KEY = faker.string.uuid();
const MOCK_FIRST_VALUE = faker.string.numeric(2);
const MOCK_SECOND_VALUE = faker.string.numeric(3);
const MOCK_THIRD_VALUE = faker.string.numeric(1);
const MOCK_FIRST_LABEL = faker.lorem.word();
const MOCK_SECOND_LABEL = faker.lorem.word();
const MOCK_THIRD_LABEL = faker.lorem.word();
const MOCK_DESCRIPTION = faker.lorem.sentence();

const statPath = (key: string, field: string) => [
  'stats',
  { _key: key },
  field,
];

describe(localizeStatsModule, () => {
  it('moves the heading, supporting text, footnote and every stat into the default language', () => {
    expect(
      localizeStatsModule({
        headingBlock: mockPlainHeadingBlock(MOCK_HEADING, MOCK_SUPPORTING_TEXT),
        stats: [
          {
            _key: MOCK_FIRST_KEY,
            value: MOCK_FIRST_VALUE,
            label: MOCK_FIRST_LABEL,
            description: MOCK_DESCRIPTION,
          },
          {
            _key: MOCK_SECOND_KEY,
            value: MOCK_SECOND_VALUE,
            label: MOCK_SECOND_LABEL,
          },
          {
            _key: MOCK_THIRD_KEY,
            value: MOCK_THIRD_VALUE,
            label: MOCK_THIRD_LABEL,
          },
        ],
        footnote: MOCK_FOOTNOTE,
      }),
    ).toEqual([
      at(
        'headingBlock',
        set(mockLocalizedHeadingBlock(MOCK_HEADING, MOCK_SUPPORTING_TEXT)),
      ),
      at(
        statPath(MOCK_FIRST_KEY, 'value'),
        set(mockEnglishString(MOCK_FIRST_VALUE)),
      ),
      at(
        statPath(MOCK_FIRST_KEY, 'label'),
        set(mockEnglishString(MOCK_FIRST_LABEL)),
      ),
      at(
        statPath(MOCK_FIRST_KEY, 'description'),
        set(mockEnglishString(MOCK_DESCRIPTION)),
      ),
      at(
        statPath(MOCK_SECOND_KEY, 'value'),
        set(mockEnglishString(MOCK_SECOND_VALUE)),
      ),
      at(
        statPath(MOCK_SECOND_KEY, 'label'),
        set(mockEnglishString(MOCK_SECOND_LABEL)),
      ),
      at(
        statPath(MOCK_THIRD_KEY, 'value'),
        set(mockEnglishString(MOCK_THIRD_VALUE)),
      ),
      at(
        statPath(MOCK_THIRD_KEY, 'label'),
        set(mockEnglishString(MOCK_THIRD_LABEL)),
      ),
      at('footnote', set(mockEnglishString(MOCK_FOOTNOTE))),
    ]);
  });

  it('localizes only the stats still holding plain text', () => {
    expect(
      localizeStatsModule({
        stats: [
          {
            _key: MOCK_FIRST_KEY,
            value: mockEnglishString(MOCK_FIRST_VALUE),
            label: mockEnglishString(MOCK_FIRST_LABEL),
          },
          {
            _key: MOCK_SECOND_KEY,
            value: MOCK_SECOND_VALUE,
            label: mockEnglishString(MOCK_SECOND_LABEL),
          },
        ],
      }),
    ).toEqual([
      at(
        statPath(MOCK_SECOND_KEY, 'value'),
        set(mockEnglishString(MOCK_SECOND_VALUE)),
      ),
    ]);
  });

  it.each([
    {
      name: 'an already localized module',
      doc: {
        headingBlock: mockLocalizedHeadingBlock(MOCK_HEADING),
        stats: [
          {
            _key: MOCK_FIRST_KEY,
            value: mockEnglishString(MOCK_FIRST_VALUE),
            label: mockEnglishString(MOCK_FIRST_LABEL),
          },
        ],
        footnote: mockEnglishString(MOCK_FOOTNOTE),
      },
    },
    { name: 'a module without text', doc: {} },
  ])('leaves $name alone', ({ doc }) => {
    expect(localizeStatsModule(doc)).toBeUndefined();
  });
});
