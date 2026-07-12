import { q } from '#/sanity/query';
import { linkFragment } from '#/shared/fragments/link';

export const ctaModuleQuery = q
  .parameters<{ id: string }>()
  .star.filterByType('module_cta')
  .filterRaw('_id == $id')
  .slice(0)
  .project((sub) => ({
    heading: sub.field('heading').notNull(),
    text: sub.field('text').nullable(true),
    action: sub.field('action').project(linkFragment).notNull(),
  }))
  .notNull();
