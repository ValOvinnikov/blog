import { q } from '@blog/service/sanity/query';
import { appearanceFragment } from '@blog/service/shared/fragments/appearance';

export const postListModuleQuery = q
  .parameters<{ id: string }>()
  .star.filterByType('module_postList')
  .filterRaw('_id == $id')
  .slice(0)
  .project((sub) => ({
    title: sub.field('title').notNull(),
    limit: sub.field('limit').notNull(),
    appearance: sub
      .field('appearance')
      .project(appearanceFragment)
      .nullable(true),
  }))
  .notNull();
