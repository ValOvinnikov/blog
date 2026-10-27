import {
  mockLocalizedHeadingBlock,
  mockPlainHeadingBlock,
} from '@blog/studio/testing/migrations/localize';
import { faker } from '@faker-js/faker';
import { at, set } from 'sanity/migrate';

import { localizeLogoWallModule } from './index';

faker.seed(8);

const MOCK_HEADING = faker.lorem.words(2);
const MOCK_SUPPORTING_TEXT = faker.lorem.sentence();

describe(localizeLogoWallModule, () => {
  it('moves the heading block into the default language', () => {
    expect(
      localizeLogoWallModule({
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
      name: 'an already localized Logo Wall',
      doc: { headingBlock: mockLocalizedHeadingBlock(MOCK_HEADING) },
    },
    { name: 'a Logo Wall without a heading block', doc: {} },
  ])('leaves $name alone', ({ doc }) => {
    expect(localizeLogoWallModule(doc)).toBeUndefined();
  });
});
