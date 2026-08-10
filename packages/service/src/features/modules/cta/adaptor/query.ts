import { q } from '@blog/service/sanity/query';
import { appearanceFragment } from '@blog/service/shared/fragments/appearance';
import { linkFragment } from '@blog/service/shared/fragments/link';

export const ctaModuleQuery = q
  .parameters<{ id: string }>()
  .star.filterByType('module_cta')
  .filterRaw('_id == $id')
  .slice(0)
  .project((sub) => ({
    heading: sub.field('heading').notNull(),
    text: sub.field('text').nullable(true),
    action: sub.field('action').project(linkFragment).notNull(),
    appearance: sub
      .field('appearance')
      .project(appearanceFragment)
      .nullable(true),
  }))
  .notNull();
