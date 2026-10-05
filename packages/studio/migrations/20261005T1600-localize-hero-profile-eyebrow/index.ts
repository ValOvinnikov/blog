import { defineMigration } from 'sanity/migrate';

import { localizeStringField } from '../lib/localize-string-field';

type THeroProfileDoc = {
  eyebrow?: unknown;
};

export const localizeHeroProfileEyebrow = (doc: THeroProfileDoc) => {
  const patches = localizeStringField('eyebrow', doc.eyebrow);

  return patches.length > 0 ? patches : undefined;
};

export default defineMigration({
  title: 'Move the Profile Hero eyebrow into the default language',
  documentTypes: ['module_heroProfile'],
  migrate: {
    document(doc) {
      return localizeHeroProfileEyebrow(doc as THeroProfileDoc);
    },
  },
});
