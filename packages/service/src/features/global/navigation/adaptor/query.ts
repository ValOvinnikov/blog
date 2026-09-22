import { q } from '@blog/service/sanity/query';
import { linkDocumentFragment } from '@blog/service/shared/fragments/link/link-document/link-document';

export const navigationQuery = q.star
  .filterByType('settings_navigation')
  .slice(0)
  .project((sub) => ({
    items: sub
      .field('items[]')
      .project((item) => ({
        link: item
          .field('link')
          .deref()
          .project(linkDocumentFragment)
          .notNull(),
      }))
      .nullable(true),
  }))
  .notNull();
