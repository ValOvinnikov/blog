import { q } from '@blog/service/sanity/query';

export const newsletterSettingsQuery = q.star
  .filterByType('settings_newsletter')
  .slice(0)
  .project((sub) => ({
    heading: sub.field('heading').notNull(),
    description: sub.field('description').nullable(true),
  }))
  .notNull();
