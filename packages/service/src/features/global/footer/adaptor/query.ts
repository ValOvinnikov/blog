import { q } from '@blog/service/sanity/query';
import { linkDocumentFragment } from '@blog/service/shared/fragments/link-document';

export const footerQuery = q.star
  .filterByType('settings_footer')
  .slice(0)
  .project((sub) => ({
    social: sub
      .field('social[]')
      .project((item) => ({
        platform: item.field('platform').notNull(),
        link: item
          .field('link')
          .deref()
          .project(linkDocumentFragment)
          .notNull(),
      }))
      .nullable(true),
  }))
  .notNull();
