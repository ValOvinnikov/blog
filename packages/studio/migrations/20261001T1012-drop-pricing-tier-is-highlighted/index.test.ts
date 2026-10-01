import { at, unset } from 'sanity/migrate';

import { dropPricingTierIsHighlighted } from './index';

describe(dropPricingTierIsHighlighted, () => {
  it('removes isHighlighted and clears the label of an unhighlighted tier', () => {
    const result = dropPricingTierIsHighlighted({
      tiers: [
        { _key: 'a', isHighlighted: false, highlightLabel: 'Most popular' },
      ],
    });

    expect(result).toEqual([
      at(['tiers', { _key: 'a' }, 'isHighlighted'], unset()),
      at(['tiers', { _key: 'a' }, 'highlightLabel'], unset()),
    ]);
  });

  it('removes isHighlighted but keeps the label of a highlighted tier', () => {
    const result = dropPricingTierIsHighlighted({
      tiers: [{ _key: 'a', isHighlighted: true, highlightLabel: 'Best value' }],
    });

    expect(result).toEqual([
      at(['tiers', { _key: 'a' }, 'isHighlighted'], unset()),
    ]);
  });

  it('is idempotent — a document with no isHighlighted on any tier is left alone', () => {
    expect(
      dropPricingTierIsHighlighted({
        tiers: [{ _key: 'a', highlightLabel: 'Best value' }, { _key: 'b' }],
      }),
    ).toBeUndefined();
  });

  it('leaves a document without tiers alone', () => {
    expect(dropPricingTierIsHighlighted({})).toBeUndefined();
  });
});
