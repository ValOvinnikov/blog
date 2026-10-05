import { defineMigration } from 'sanity/migrate';

import { localizePortableTextField } from '../lib/localize-portable-text-field';

type TContentDoc = {
  body?: unknown;
};

export const localizeContentModule = (doc: TContentDoc) => {
  const patches = localizePortableTextField(
    'body',
    doc.body,
    'internationalizedArrayArticleTextValue',
  );

  return patches.length > 0 ? patches : undefined;
};

export default defineMigration({
  title: 'Move Content module body into the default language',
  documentTypes: ['module_content'],
  migrate: {
    document(doc) {
      return localizeContentModule(doc as TContentDoc);
    },
  },
});
