import { q } from '@blog/service/sanity/query';
import { layoutFragment } from '@blog/service/shared/fragments/layout';
import { linkFragment } from '@blog/service/shared/fragments/link';
import { requiredSectionHeaderFragment } from '@blog/service/shared/fragments/section-header';

export const ctaModuleQuery = q
  .parameters<{ id: string }>()
  .star.filterByType('module_cta')
  .filterRaw('_id == $id')
  .slice(0)
  .project((sub) => ({
    brandVariant: sub.field('brandVariant').notNull(),
    sectionHeader: sub
      .field('sectionHeader')
      .project(requiredSectionHeaderFragment)
      .notNull(),
    action: sub.field('action').project(linkFragment).notNull(),
    layout: sub.field('layout').project(layoutFragment).nullable(true),
  }))
  .notNull();
