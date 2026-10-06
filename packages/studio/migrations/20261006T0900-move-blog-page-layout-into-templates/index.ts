import { defineMigration } from 'sanity/migrate';

import {
  moveLayoutIntoTemplates,
  type TLayoutPageDocument,
} from '../lib/move-layout-into-templates';

const TEMPLATE_TYPE_BY_PAGE_TYPE = {
  page_postIndex: 'template_postIndex',
  page_topicIndex: 'template_topicIndex',
  page_tagIndex: 'template_tagIndex',
  page_topic: 'template_topic',
  page_tag: 'template_tag',
};

export const migrateBlogPageDocument = moveLayoutIntoTemplates(
  TEMPLATE_TYPE_BY_PAGE_TYPE,
);

export default defineMigration({
  title: 'Move blog page hero and modules into page templates',
  documentTypes: Object.keys(TEMPLATE_TYPE_BY_PAGE_TYPE),
  migrate: {
    document(doc, context) {
      return migrateBlogPageDocument(
        doc as unknown as TLayoutPageDocument,
        context,
      );
    },
  },
});
