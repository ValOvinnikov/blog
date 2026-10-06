import { defineMigration } from 'sanity/migrate';

import {
  backfillLanguage,
  type TTranslatedDoc,
} from '../lib/backfill-language';

export default defineMigration({
  title: 'Backfill page_topic and page_tag language to EN',
  documentTypes: ['page_topic', 'page_tag'],
  migrate: {
    document(doc) {
      return backfillLanguage(doc as TTranslatedDoc);
    },
  },
});
