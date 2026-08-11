import { q } from '@blog/service/sanity/query';
import { appearanceFragment } from '@blog/service/shared/fragments/appearance';

export const newsletterModuleQuery = q
  .parameters<{ id: string }>()
  .star.filterByType('module_newsletter')
  .filterRaw('_id == $id')
  .slice(0)
  .project((sub) => ({
    brandVariant: sub.field('brandVariant').notNull(),
    heading: sub.field('heading').notNull(),
    description: sub.field('description').nullable(true),
    appearance: sub
      .field('appearance')
      .project(appearanceFragment)
      .nullable(true),
  }))
  .notNull();
