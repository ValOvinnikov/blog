import { q } from '@blog/service/sanity/query';
import { appearanceFragment } from '@blog/service/shared/fragments/appearance';

export const contentModuleQuery = q
  .parameters<{ id: string }>()
  .star.filterByType('module_content')
  .filterRaw('_id == $id')
  .slice(0)
  .project((sub) => ({
    title: sub.field('title').notNull(),
    body: sub.field('body[]').notNull(),
    appearance: sub
      .field('appearance')
      .project(appearanceFragment)
      .nullable(true),
  }))
  .notNull();
