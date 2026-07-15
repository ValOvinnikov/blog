import { q } from '@blog/service/sanity/query';
import { seoFragment } from '@blog/service/shared/fragments/seo';

// `page_blog` is a singleton and may be unauthored — `.nullable(true)` at the
// end (rather than `.notNull()`, as page_home/settings_site use) lets the
// loader fall back instead of throwing.
export const blogIndexSettingsQuery = q.star
  .filterByType('page_blog')
  .slice(0)
  .project((sub) => ({
    heading: sub.field('heading').notNull(),
    supportingText: sub.field('supportingText').nullable(true),
    itemsPerPage: sub.field('itemsPerPage').notNull(),
    seo: sub.field('seo').project(seoFragment).nullable(true),
  }))
  .nullable(true);
