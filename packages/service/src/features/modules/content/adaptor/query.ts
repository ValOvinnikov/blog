import { q } from '@blog/service/sanity/query';

export const contentModuleQuery = q
  .parameters<{ id: string }>()
  .star.filterByType('module_content')
  .filterRaw('_id == $id')
  .slice(0)
  .project((sub) => ({
    title: sub.field('title').notNull(),
    body: sub.field('body[]').notNull(),
  }))
  .notNull();
