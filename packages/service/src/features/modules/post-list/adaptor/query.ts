import { q } from '@blog/service/sanity/query';

export const postListModuleQuery = q
  .parameters<{ id: string }>()
  .star.filterByType('module_postList')
  .filterRaw('_id == $id')
  .slice(0)
  .project((sub) => ({
    title: sub.field('title').notNull(),
    limit: sub.field('limit').notNull(),
  }))
  .notNull();
