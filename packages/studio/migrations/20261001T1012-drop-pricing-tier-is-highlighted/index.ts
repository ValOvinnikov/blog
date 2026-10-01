import { at, defineMigration, unset } from 'sanity/migrate';

type TPricingTier = {
  _key: string;
  isHighlighted?: boolean;
  highlightLabel?: string;
};
type TPricingDoc = { tiers?: TPricingTier[] };

export const dropPricingTierIsHighlighted = (doc: TPricingDoc) => {
  const patches = (doc.tiers ?? []).flatMap((tier) => {
    if (tier.isHighlighted === undefined) return [];

    const tierPath = ['tiers', { _key: tier._key }];
    const tierPatches = [at([...tierPath, 'isHighlighted'], unset())];

    if (tier.isHighlighted !== true && tier.highlightLabel !== undefined) {
      tierPatches.push(at([...tierPath, 'highlightLabel'], unset()));
    }

    return tierPatches;
  });

  return patches.length > 0 ? patches : undefined;
};

export default defineMigration({
  title: 'Drop pricing tier isHighlighted',
  documentTypes: ['module_pricing'],
  migrate: {
    document(doc) {
      return dropPricingTierIsHighlighted(doc as TPricingDoc);
    },
  },
});
