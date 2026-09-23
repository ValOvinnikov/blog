import { q, type TModuleQueryParams } from '@blog/service/sanity/query';
import { layoutFragment } from '@blog/service/shared/fragments/layout/layout';
import { portableTextBodyItemFragment } from '@blog/service/shared/fragments/portable-text/portable-text-body-item';

export const contentModuleQuery = q
  .parameters<TModuleQueryParams>()
  .star.filterByType('module_content')
  .filterBy('_id == $id')
  .slice(0)
  .project((sub) => ({
    brandVariant: sub.field('brandVariant').notNull(),
    body: sub.field('body[]').project(portableTextBodyItemFragment).notNull(),
    layout: sub.field('layout').project(layoutFragment).nullable(true),
  }))
  .notNull();
