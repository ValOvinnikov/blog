import { q } from '#/sanity/query';
import { linkFragment } from '#/shared/fragments/link';

export const footerQuery = q.star
  .filterByType('settings_footer')
  .slice(0)
  .project((sub) => ({
    social: sub.field('social[]').project(linkFragment).nullable(true),
  }))
  .notNull();
