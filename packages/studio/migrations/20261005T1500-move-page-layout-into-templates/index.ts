import { defineMigration } from 'sanity/migrate';

import {
  moveLayoutIntoTemplates,
  type TLayoutPageDocument,
} from '../lib/move-layout-into-templates';

const TEMPLATE_TYPE_BY_PAGE_TYPE = {
  page_home: 'template_home',
  page_landing: 'template_landing',
};

export const migratePageDocument = moveLayoutIntoTemplates(
  TEMPLATE_TYPE_BY_PAGE_TYPE,
);

export default defineMigration({
  title: 'Move Landing and Home hero and modules into shared page templates',
  documentTypes: Object.keys(TEMPLATE_TYPE_BY_PAGE_TYPE),
  migrate: {
    document(doc, context) {
      return migratePageDocument(
        doc as unknown as TLayoutPageDocument,
        context,
      );
    },
  },
});
