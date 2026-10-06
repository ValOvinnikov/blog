import { at, defineMigration, set } from 'sanity/migrate';

import { localizedString } from '../lib/in-default-locale';
import {
  localizeHeadingBlock,
  type THeadingBlockValue,
} from '../lib/localize-heading-block';
import { localizeStringField } from '../lib/localize-string-field';

type TPricingTier = {
  _key: string;
  name?: unknown;
  description?: unknown;
  priceLabel?: unknown;
  features?: unknown[];
  highlightLabel?: unknown;
  footnote?: unknown;
};

type TPricingDoc = {
  headingBlock?: THeadingBlockValue;
  tiers?: TPricingTier[];
  footnote?: unknown;
};

const toPricingFeature = (feature: unknown, index: number) =>
  typeof feature === 'string'
    ? {
        _key: `feature-${String(index + 1)}`,
        _type: 'pricingFeature',
        text: localizedString(feature),
      }
    : feature;

const localizeFeatures = (
  path: Parameters<typeof at>[0],
  features: unknown[] | undefined,
) =>
  features?.some((feature) => typeof feature === 'string')
    ? [at(path, set(features.map(toPricingFeature)))]
    : [];

const localizeTier = (tier: TPricingTier) => {
  const tierPath = ['tiers', { _key: tier._key }];

  return [
    ...localizeStringField([...tierPath, 'name'], tier.name),
    ...localizeStringField([...tierPath, 'description'], tier.description),
    ...localizeStringField([...tierPath, 'priceLabel'], tier.priceLabel),
    ...localizeFeatures([...tierPath, 'features'], tier.features),
    ...localizeStringField(
      [...tierPath, 'highlightLabel'],
      tier.highlightLabel,
    ),
    ...localizeStringField([...tierPath, 'footnote'], tier.footnote),
  ];
};

export const localizePricingModule = (doc: TPricingDoc) => {
  const patches = [
    ...localizeHeadingBlock(doc.headingBlock),
    ...(doc.tiers ?? []).flatMap(localizeTier),
    ...localizeStringField('footnote', doc.footnote),
  ];

  return patches.length > 0 ? patches : undefined;
};

export default defineMigration({
  title: 'Move Pricing module text into the default language',
  documentTypes: ['module_pricing'],
  migrate: {
    document(doc) {
      return localizePricingModule(doc as TPricingDoc);
    },
  },
});
