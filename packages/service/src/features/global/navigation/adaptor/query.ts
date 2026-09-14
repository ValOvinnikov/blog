import { q } from '@blog/service/sanity/query';
import { linkRefFragment } from '@blog/service/shared/fragments/link';

export const navigationQuery = q.star
  .filterByType('settings_navigation')
  .slice(0)
  .project((sub) => ({
    items: sub.field('items[]').project(linkRefFragment).nullable(true),
  }))
  .notNull();
