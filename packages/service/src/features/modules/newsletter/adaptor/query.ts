import { q } from '@blog/service/sanity/query';

export const newsletterModuleQuery = q
  .parameters<{ id: string }>()
  .star.filterByType('module_newsletter')
  .filterRaw('_id == $id')
  .slice(0)
  .project((sub) => ({
    heading: sub.field('heading').notNull(),
    description: sub.field('description').nullable(true),
  }))
  .notNull();
