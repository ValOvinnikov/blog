import { q } from '#/sanity/query';
import { linkFragment } from '#/shared/fragments/link';

export const navigationQuery = q.star
  .filterByType('settings_navigation')
  .slice(0)
  .project((sub) => ({
    items: sub.field('items[]').project(linkFragment).nullable(true),
  }))
  .notNull();
