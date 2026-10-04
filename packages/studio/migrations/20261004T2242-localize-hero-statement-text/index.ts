import { defineMigration } from 'sanity/migrate';

import {
  localizeHeadingBlock,
  localizeImage,
  localizeStringField,
  type TSanityObject,
} from '../lib/localize-into-default-locale';

type THeroStatementDoc = {
  headingBlock?: TSanityObject;
  eyebrow?: unknown;
  image?: TSanityObject;
};

export const localizeHeroStatementModule = (doc: THeroStatementDoc) => {
  const patches = [
    ...localizeHeadingBlock(doc.headingBlock),
    ...localizeStringField('eyebrow', doc.eyebrow),
    ...localizeImage(doc.image),
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
