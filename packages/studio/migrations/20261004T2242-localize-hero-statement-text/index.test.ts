import {
  mockImageAsset,
  mockLocalizedHeadingBlock,
  mockLocalizedImage,
  mockPlainHeadingBlock,
  mockPlainImage,
} from '@blog/studio/testing/migrations/localize';
import { mockEnglishString } from '@blog/studio/testing/migrations/localized';
import { faker } from '@faker-js/faker';
import { at, set } from 'sanity/migrate';

import { localizeHeroStatementModule } from './index';

faker.seed(3);

const MOCK_HEADING = faker.lorem.words(2);
const MOCK_SUPPORTING_TEXT = faker.lorem.sentence();
const MOCK_EYEBROW = faker.lorem.word();
const MOCK_ALT = faker.lorem.words(3);
const MOCK_ASSET = mockImageAsset();

describe(localizeHeroStatementModule, () => {
  it('moves the heading, supporting text, eyebrow and image alt into the default language', () => {
    expect(
      localizeHeroStatementModule({
        headingBlock: mockPlainHeadingBlock(MOCK_HEADING, MOCK_SUPPORTING_TEXT),
        eyebrow: MOCK_EYEBROW,
        image: mockPlainImage(MOCK_ASSET, MOCK_ALT),
      }),
    ).toEqual([
      at(
        'headingBlock',
        set(mockLocalizedHeadingBlock(MOCK_HEADING, MOCK_SUPPORTING_TEXT)),
      ),
      at('eyebrow', set(mockEnglishString(MOCK_EYEBROW))),
      at('image', set(mockLocalizedImage(MOCK_ASSET, MOCK_ALT))),
    ]);
  });

  it.each([
    {
      name: 'an already localized hero',
      doc: {
        headingBlock: mockLocalizedHeadingBlock(MOCK_HEADING),
        eyebrow: mockEnglishString(MOCK_EYEBROW),
        image: mockLocalizedImage(MOCK_ASSET, MOCK_ALT),
      },
    },
    { name: 'a hero without text', doc: {} },
  ])('leaves $name alone', ({ doc }) => {
    expect(localizeHeroStatementModule(doc)).toBeUndefined();
  });
});
