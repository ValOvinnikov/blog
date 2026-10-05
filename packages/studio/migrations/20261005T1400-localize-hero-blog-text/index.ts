import { defineMigration } from 'sanity/migrate';

import { localizeImage, type TImageValue } from '../lib/localize-image';
import { localizeStringField } from '../lib/localize-string-field';

type THeroBlogDoc = {
  eyebrow?: unknown;
  primaryActionLabel?: unknown;
  image?: TImageValue;
};

export const localizeHeroBlogModule = (doc: THeroBlogDoc) => {
  const patches = [
    ...localizeStringField('eyebrow', doc.eyebrow),
    ...localizeStringField('primaryActionLabel', doc.primaryActionLabel),
    ...localizeImage('image', doc.image),
  ];

  return patches.length > 0 ? patches : undefined;
};

export default defineMigration({
  title: 'Move Blog Hero text into the default language',
  documentTypes: ['module_heroBlog'],
  migrate: {
    document(doc) {
      return localizeHeroBlogModule(doc as THeroBlogDoc);
    },
  },
});
