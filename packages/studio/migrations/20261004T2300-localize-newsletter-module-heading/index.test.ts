import {
  mockLocalizedHeadingBlock,
  mockPlainHeadingBlock,
} from '@blog/studio/testing/migrations/localize';
import { faker } from '@faker-js/faker';
import { at, set } from 'sanity/migrate';

import { localizeNewsletterModule } from './index';

faker.seed(4);

const MOCK_HEADING = faker.lorem.words(3);
const MOCK_SUPPORTING_TEXT = faker.lorem.sentence();

describe(localizeNewsletterModule, () => {
  it('moves the heading block into the default language', () => {
    expect(
      localizeNewsletterModule({
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
      name: 'an already localized Newsletter',
      doc: { headingBlock: mockLocalizedHeadingBlock(MOCK_HEADING) },
    },
    { name: 'a Newsletter without a heading block', doc: {} },
  ])('leaves $name alone', ({ doc }) => {
    expect(localizeNewsletterModule(doc)).toBeUndefined();
  });
});
