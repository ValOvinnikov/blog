import {
  mockLocalizedHeadingBlock,
  mockPlainHeadingBlock,
} from '@blog/studio/testing/migrations/localize';
import { mockEnglishString } from '@blog/studio/testing/migrations/localized';
import { faker } from '@faker-js/faker';
import { at, set } from 'sanity/migrate';

import { localizePricingModule } from './index';

faker.seed(9);

const MOCK_HEADING = faker.lorem.words(2);
const MOCK_PRO_KEY = faker.string.uuid();
const MOCK_ENTERPRISE_KEY = faker.string.uuid();
const MOCK_TEAM_KEY = faker.string.uuid();
const MOCK_PRO_NAME = faker.lorem.word();
const MOCK_ENTERPRISE_NAME = faker.lorem.word();
const MOCK_TEAM_NAME = faker.lorem.word();
const MOCK_DESCRIPTION = faker.lorem.sentence();
const MOCK_PRICE_LABEL = faker.commerce.price();
const MOCK_HIGHLIGHT_LABEL = faker.lorem.words(2);
const MOCK_TIER_FOOTNOTE = faker.lorem.sentence();
const MOCK_FOOTNOTE = faker.lorem.sentence();
const MOCK_FIRST_FEATURE = faker.lorem.words(2);
const MOCK_SECOND_FEATURE = faker.lorem.words(2);
const MOCK_THIRD_FEATURE = faker.lorem.words(2);
const MOCK_FEATURES = [
  MOCK_FIRST_FEATURE,
  MOCK_SECOND_FEATURE,
  MOCK_THIRD_FEATURE,
];

const mockFeature = (key: string, text: string) => ({
  _key: key,
  _type: 'pricingFeature',
  text: mockEnglishString(text),
});

const MOCK_FIRST_FEATURE_ITEM = mockFeature('feature-1', MOCK_FIRST_FEATURE);
const MOCK_SECOND_FEATURE_ITEM = mockFeature('feature-2', MOCK_SECOND_FEATURE);
const MOCK_THIRD_FEATURE_ITEM = mockFeature('feature-3', MOCK_THIRD_FEATURE);

const tierPath = (key: string, field: string) => [
  'tiers',
  { _key: key },
  field,
];

describe(localizePricingModule, () => {
  it('moves the heading, footnote and every tier text into the default language', () => {
    expect(
      localizePricingModule({
        headingBlock: mockPlainHeadingBlock(MOCK_HEADING),
        tiers: [
          {
            _key: MOCK_PRO_KEY,
            name: MOCK_PRO_NAME,
            description: MOCK_DESCRIPTION,
            features: MOCK_FEATURES,
            highlightLabel: MOCK_HIGHLIGHT_LABEL,
            footnote: MOCK_TIER_FOOTNOTE,
          },
          {
            _key: MOCK_ENTERPRISE_KEY,
            name: MOCK_ENTERPRISE_NAME,
            priceLabel: MOCK_PRICE_LABEL,
          },
        ],
        footnote: MOCK_FOOTNOTE,
      }),
    ).toEqual([
      at('headingBlock', set(mockLocalizedHeadingBlock(MOCK_HEADING))),
      at(tierPath(MOCK_PRO_KEY, 'name'), set(mockEnglishString(MOCK_PRO_NAME))),
      at(
        tierPath(MOCK_PRO_KEY, 'description'),
        set(mockEnglishString(MOCK_DESCRIPTION)),
      ),
      at(
        tierPath(MOCK_PRO_KEY, 'features'),
        set([
          MOCK_FIRST_FEATURE_ITEM,
          MOCK_SECOND_FEATURE_ITEM,
          MOCK_THIRD_FEATURE_ITEM,
        ]),
      ),
      at(
        tierPath(MOCK_PRO_KEY, 'highlightLabel'),
        set(mockEnglishString(MOCK_HIGHLIGHT_LABEL)),
      ),
      at(
        tierPath(MOCK_PRO_KEY, 'footnote'),
        set(mockEnglishString(MOCK_TIER_FOOTNOTE)),
      ),
      at(
        tierPath(MOCK_ENTERPRISE_KEY, 'name'),
        set(mockEnglishString(MOCK_ENTERPRISE_NAME)),
      ),
      at(
        tierPath(MOCK_ENTERPRISE_KEY, 'priceLabel'),
        set(mockEnglishString(MOCK_PRICE_LABEL)),
      ),
      at('footnote', set(mockEnglishString(MOCK_FOOTNOTE))),
    ]);
  });

  it('localizes only the tiers still holding plain text', () => {
    expect(
      localizePricingModule({
        tiers: [
          {
            _key: MOCK_PRO_KEY,
            name: mockEnglishString(MOCK_PRO_NAME),
            features: [MOCK_FIRST_FEATURE_ITEM],
          },
          {
            _key: MOCK_TEAM_KEY,
            name: MOCK_TEAM_NAME,
            features: [MOCK_SECOND_FEATURE_ITEM],
          },
        ],
      }),
    ).toEqual([
      at(
        tierPath(MOCK_TEAM_KEY, 'name'),
        set(mockEnglishString(MOCK_TEAM_NAME)),
      ),
    ]);
  });

  it.each([
    {
      name: 'an already localized module',
      doc: {
        headingBlock: mockLocalizedHeadingBlock(MOCK_HEADING),
        tiers: [
          {
            _key: MOCK_PRO_KEY,
            name: mockEnglishString(MOCK_PRO_NAME),
            features: [MOCK_FIRST_FEATURE_ITEM, MOCK_SECOND_FEATURE_ITEM],
            highlightLabel: mockEnglishString(MOCK_HIGHLIGHT_LABEL),
          },
        ],
        footnote: mockEnglishString(MOCK_FOOTNOTE),
      },
    },
    { name: 'a module without text', doc: {} },
  ])('leaves $name alone', ({ doc }) => {
    expect(localizePricingModule(doc)).toBeUndefined();
  });
});
