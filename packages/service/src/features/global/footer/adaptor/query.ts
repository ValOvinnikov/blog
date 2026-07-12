import { q } from '@blog/service/sanity/query';
import { linkFragment } from '@blog/service/shared/fragments/link';

export const footerQuery = q.star
  .filterByType('settings_footer')
  .slice(0)
  .project((sub) => ({
    social: sub.field('social[]').project(linkFragment).nullable(true),
  }))
  .notNull();
