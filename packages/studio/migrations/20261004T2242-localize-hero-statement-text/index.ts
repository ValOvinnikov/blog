import { defineMigration } from 'sanity/migrate';

import {
  localizeHeadingBlock,
  type THeadingBlockValue,
} from '../lib/localize-heading-block';
import { localizeImage, type TImageValue } from '../lib/localize-image';
import { localizeStringField } from '../lib/localize-string-field';

type THeroStatementDoc = {
  headingBlock?: THeadingBlockValue;
  eyebrow?: unknown;
  image?: TImageValue;
};

export const localizeHeroStatementModule = (doc: THeroStatementDoc) => {
  const patches = [
    ...localizeHeadingBlock(doc.headingBlock),
    ...localizeStringField('eyebrow', doc.eyebrow),
    ...localizeImage('image', doc.image),
  ];

  return patches.length > 0 ? patches : undefined;
};

export default defineMigration({
  title: 'Move Statement Hero text into the default language',
  documentTypes: ['module_heroStatement'],
  migrate: {
    document(doc) {
      return localizeHeroStatementModule(doc as THeroStatementDoc);
    },
  },
});
