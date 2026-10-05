import { defineMigration } from 'sanity/migrate';

import {
  localizeHeadingBlock,
  type THeadingBlockValue,
} from '../lib/localize-heading-block';
import { localizeImage, type TImageValue } from '../lib/localize-image';

type TFeatureListText = {
  _type?: string;
  headingBlock?: THeadingBlockValue;
  image?: TImageValue;
};

export const localizeFeatureListText = (doc: TFeatureListText) => {
  const patches = [
    ...localizeHeadingBlock(doc.headingBlock),
    ...(doc._type === 'block_feature' ? localizeImage('image', doc.image) : []),
  ];

  return patches.length > 0 ? patches : undefined;
};

export default defineMigration({
  title: 'Move Feature List module and feature text into the default language',
  documentTypes: ['module_featureList', 'block_feature'],
  migrate: {
    document(doc) {
      return localizeFeatureListText(doc as TFeatureListText);
    },
  },
});
