import { q } from '@blog/service/sanity/query';
import { layoutFragment } from '@blog/service/shared/fragments/layout';
import { sectionHeaderFragment } from '@blog/service/shared/fragments/section-header';

export const taxonomyListModuleQuery = q
  .parameters<{ id: string }>()
  .star.filterByType('module_taxonomyList')
  .filterRaw('_id == $id')
  .slice(0)
  .project((sub) => ({
    brandVariant: sub.field('brandVariant').notNull(),
    sectionHeader: sub
      .field('sectionHeader')
      .project(sectionHeaderFragment)
      .nullable(true),
    layout: sub.field('layout').project(layoutFragment).nullable(true),
    contentAlignment: sub.field('contentAlignment').nullable(true),
  }))
  .notNull();
