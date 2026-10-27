import {
  mockLocalizedHeadingBlock,
  mockPlainHeadingBlock,
} from '@blog/studio/testing/migrations/localized';
import { faker } from '@faker-js/faker';
import { at, set } from 'sanity/migrate';

import { localizeBlogListModuleHeading } from './index';

faker.seed(13);

const MOCK_HEADING = faker.lorem.words(2);
const MOCK_SUPPORTING_TEXT = faker.lorem.sentence();

describe(localizeBlogListModuleHeading, () => {
  it('moves the heading block into the default language', () => {
    expect(
      localizeBlogListModuleHeading({
        headingBlock: mockPlainHeadingBlock(MOCK_HEADING, MOCK_SUPPORTING_TEXT),
      }),
    ).toEqual([
      at(
        'headingBlock',
        set(mockLocalizedHeadingBlock(MOCK_HEADING, MOCK_SUPPORTING_TEXT)),
      ),
    ]);
  });

  it.each([
    {
      name: 'an already localized heading block',
      doc: { headingBlock: mockLocalizedHeadingBlock(MOCK_HEADING) },
    },
    { name: 'a module without a heading block', doc: {} },
  ])('leaves $name alone', ({ doc }) => {
    expect(localizeBlogListModuleHeading(doc)).toBeUndefined();
  });
});
