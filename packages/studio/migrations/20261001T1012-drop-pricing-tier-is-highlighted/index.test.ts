import { faker } from '@faker-js/faker';
import { at, unset } from 'sanity/migrate';

import { dropPricingTierIsHighlighted } from './index';

faker.seed(10120);

const MOCK_TIER_KEY = faker.string.alphanumeric(12);
const MOCK_OTHER_TIER_KEY = faker.string.alphanumeric(12);
const MOCK_HIGHLIGHT_LABEL = faker.lorem.words(2);

const tierPath = (field: string) => ['tiers', { _key: MOCK_TIER_KEY }, field];

describe(dropPricingTierIsHighlighted, () => {
  it('removes isHighlighted and clears the label of an unhighlighted tier', () => {
    const result = dropPricingTierIsHighlighted({
      tiers: [
        {
          _key: MOCK_TIER_KEY,
          isHighlighted: false,
          highlightLabel: MOCK_HIGHLIGHT_LABEL,
        },
      ],
    });

    expect(result).toEqual([
      at(tierPath('isHighlighted'), unset()),
      at(tierPath('highlightLabel'), unset()),
    ]);
  });

  it('removes isHighlighted but keeps the label of a highlighted tier', () => {
    const result = dropPricingTierIsHighlighted({
      tiers: [
        {
          _key: MOCK_TIER_KEY,
          isHighlighted: true,
          highlightLabel: MOCK_HIGHLIGHT_LABEL,
        },
      ],
    });

    expect(result).toEqual([at(tierPath('isHighlighted'), unset())]);
  });

  it('leaves a document with no isHighlighted on any tier alone', () => {
    const result = dropPricingTierIsHighlighted({
      tiers: [
        { _key: MOCK_TIER_KEY, highlightLabel: MOCK_HIGHLIGHT_LABEL },
        { _key: MOCK_OTHER_TIER_KEY },
      ],
    });

    expect(result).toBeUndefined();
  });

  it('leaves a document without tiers alone', () => {
    const result = dropPricingTierIsHighlighted({});

    expect(result).toBeUndefined();
  });
});
