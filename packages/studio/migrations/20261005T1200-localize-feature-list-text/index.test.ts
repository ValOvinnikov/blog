import {
  mockImageAsset,
  mockLocalizedHeadingBlock,
  mockLocalizedImage,
  mockPlainHeadingBlock,
  mockPlainImage,
} from '@blog/studio/testing/migrations/localized';
import { faker } from '@faker-js/faker';
import { at, set } from 'sanity/migrate';

import { localizeFeatureListText } from './index';

faker.seed(11);

const MOCK_MODULE_HEADING = faker.lorem.words(3);
const MOCK_FEATURE_HEADING = faker.lorem.words(2);
const MOCK_ALT = faker.lorem.words(2);
const MOCK_ASSET = mockImageAsset();

describe(localizeFeatureListText, () => {
  it('moves a Feature List module heading block into the default language', () => {
    expect(
      localizeFeatureListText({
        _type: 'module_featureList',
        headingBlock: mockPlainHeadingBlock(MOCK_MODULE_HEADING),
      }),
    ).toEqual([
      at('headingBlock', set(mockLocalizedHeadingBlock(MOCK_MODULE_HEADING))),
    ]);
  });

  it('moves a feature heading block and image alt into the default language', () => {
    expect(
      localizeFeatureListText({
        _type: 'block_feature',
        headingBlock: mockPlainHeadingBlock(MOCK_FEATURE_HEADING),
        image: mockPlainImage(MOCK_ASSET, MOCK_ALT),
      }),
    ).toEqual([
      at('headingBlock', set(mockLocalizedHeadingBlock(MOCK_FEATURE_HEADING))),
      at('image', set(mockLocalizedImage(MOCK_ASSET, MOCK_ALT))),
    ]);
  });

  it.each([
    {
      name: 'an already localized feature',
      doc: {
        _type: 'block_feature',
        headingBlock: mockLocalizedHeadingBlock(MOCK_FEATURE_HEADING),
        image: mockLocalizedImage(MOCK_ASSET, MOCK_ALT),
      },
    },
    {
      name: 'a feature with only an icon and no heading block',
      doc: { _type: 'block_feature' },
    },
  ])('leaves $name alone', ({ doc }) => {
    expect(localizeFeatureListText(doc)).toBeUndefined();
  });
});
