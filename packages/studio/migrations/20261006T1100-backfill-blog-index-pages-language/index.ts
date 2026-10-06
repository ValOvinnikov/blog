import { defineMigration } from 'sanity/migrate';

import {
  backfillLanguage,
  type TTranslatedDoc,
} from '../lib/backfill-language';

export default defineMigration({
  title:
    'Backfill page_postIndex, page_topicIndex and page_tagIndex language to EN',
  documentTypes: ['page_postIndex', 'page_topicIndex', 'page_tagIndex'],
  migrate: {
    document(doc) {
      return backfillLanguage(doc as TTranslatedDoc);
    },
  },
});
