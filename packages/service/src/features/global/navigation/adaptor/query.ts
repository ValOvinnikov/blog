import { q } from '#/sanity/query';

export const navigationQuery = q.star
  .filterByType('settings_navigation')
  .slice(0)
  .project((sub) => ({
    items: sub
      .field('items[]')
      .project((s) => ({
        label: s.field('label').notNull(),
        href: s.field('href').notNull(),
      }))
      .nullable(true),
  }))
  .notNull();
