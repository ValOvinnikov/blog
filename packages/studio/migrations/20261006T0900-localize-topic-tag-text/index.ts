import { defineMigration } from 'sanity/migrate';

import { localizeStringField } from '../lib/localize-string-field';

type TTaxonomyDoc = {
  title?: unknown;
  description?: unknown;
};

export const localizeTaxonomyText = (doc: TTaxonomyDoc) => {
  const patches = [
    ...localizeStringField('title', doc.title),
    ...localizeStringField(
      'description',
      doc.description,
      'internationalizedArrayTextValue',
    ),
  ];

  return patches.length > 0 ? patches : undefined;
};

export default defineMigration({
  title: 'Move topic and tag titles and descriptions into the default language',
  documentTypes: ['blog_topic', 'blog_tag'],
  migrate: {
    document(doc) {
      return localizeTaxonomyText(doc as TTaxonomyDoc);
    },
  },
});
