import { q } from '@blog/service/sanity/query';
import { actionGroupFragment } from '@blog/service/shared/fragments/action-group';
import { requiredHeadingBlockFragment } from '@blog/service/shared/fragments/heading-block';
import { sanityImageFragment } from '@blog/service/shared/fragments/image';
import { heroLayoutFragment } from '@blog/service/shared/fragments/layout';

export const heroStatementModuleQuery = q
  .parameters<{ id: string }>()
  .star.filterByType('module_heroStatement')
  .filterRaw('_id == $id')
  .slice(0)
  .project((sub) => ({
    brandVariant: sub.field('brandVariant').notNull(),
    variant: sub.field('variant').notNull(),
    eyebrow: sub.field('eyebrow').nullable(true),
    headingBlock: sub
      .field('headingBlock')
      .project(requiredHeadingBlockFragment)
      .notNull(),
    image: sub.field('image').project(sanityImageFragment).nullable(true),
    actions: sub.field('actions').project(actionGroupFragment).nullable(true),
    contentPositionSplit: sub.field('contentPositionSplit').nullable(true),
    contentPositionBanner: sub.field('contentPositionBanner').nullable(true),
    contentAlignment: sub.field('contentAlignment').nullable(true),
    mediaOrderSplit: sub.field('mediaOrderSplit').nullable(true),
    mediaOrderStacked: sub.field('mediaOrderStacked').nullable(true),
    layout: sub.field('layout').project(heroLayoutFragment).nullable(true),
  }))
  .notNull();
