import { defineMigration } from 'sanity/migrate';

import {
  backfillLanguage,
  type TTranslatedDoc,
} from '../lib/backfill-language';

export default defineMigration({
  title: 'Backfill page_post language to EN',
  documentTypes: ['page_post'],
  migrate: {
    document(doc) {
      return backfillLanguage(doc as TTranslatedDoc);
    },
  },
});
