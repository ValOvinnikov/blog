import { q } from '@blog/service/sanity/query';
import { layoutFragment } from '@blog/service/shared/fragments/layout';
import { portableTextBodyItemFragment } from '@blog/service/shared/fragments/portable-text-body';

export const contentModuleQuery = q
  .parameters<{ id: string }>()
  .star.filterByType('module_content')
  .filterRaw('_id == $id')
  .slice(0)
  .project((sub) => ({
    brandVariant: sub.field('brandVariant').notNull(),
    body: sub.field('body[]').project(portableTextBodyItemFragment).notNull(),
    layout: sub.field('layout').project(layoutFragment).nullable(true),
  }))
  .notNull();
