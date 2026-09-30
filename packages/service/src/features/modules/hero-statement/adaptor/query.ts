import { q, type TModuleQueryParams } from '@blog/service/sanity/query';
import { ctaButtonsFragment } from '@blog/service/shared/fragments/cta/cta-buttons';
import { headingBlockFragment } from '@blog/service/shared/fragments/heading-block/heading-block';
import { sanityImageFragment } from '@blog/service/shared/fragments/image/image';
import { moduleHeroLayoutFragment } from '@blog/service/shared/fragments/layout/layout';
import { moduleContentAlignmentFragment } from '@blog/service/shared/fragments/module/module-content-alignment';

export const heroStatementModuleQuery = q
  .parameters<TModuleQueryParams>()
  .star.filterByType('module_heroStatement')
  .filterBy('_id == $id')
  .slice(0)
  .project((sub) => ({
    brandVariant: sub.field('brandVariant').notNull(),
    variant: sub.field('variant').notNull(),
    eyebrow: sub.field('eyebrow').nullable(true),
    headingBlock: sub
      .field('headingBlock')
      .project(headingBlockFragment)
      .notNull(),
    image: sub.field('image').project(sanityImageFragment).nullable(true),
    ...ctaButtonsFragment,
    contentPositionSplit: sub.field('contentPositionSplit').nullable(true),
    contentPositionBanner: sub.field('contentPositionBanner').nullable(true),
    ...moduleContentAlignmentFragment,
    mediaOrderSplit: sub.field('mediaOrderSplit').nullable(true),
    mediaOrderStacked: sub.field('mediaOrderStacked').nullable(true),
    ...moduleHeroLayoutFragment,
  }))
  .notNull();
