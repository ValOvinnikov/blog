import { q, type TModuleQueryParams } from '@blog/service/sanity/query';
import { ctaButtonsFragment } from '@blog/service/shared/fragments/cta/cta-buttons';
import { headingBlockFragment } from '@blog/service/shared/fragments/heading-block/heading-block';
import { sanityImageFragment } from '@blog/service/shared/fragments/image/image';
import { moduleHeroLayoutFragment } from '@blog/service/shared/fragments/layout/layout';
import { moduleContentAlignmentFragment } from '@blog/service/shared/fragments/module/module-content-alignment';
import { personDetailFragment } from '@blog/service/shared/fragments/person/person';
import { z } from 'zod';

export const heroProfileModuleQuery = q
  .parameters<TModuleQueryParams>()
  .star.filterByType('module_heroProfile')
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
    showSocialLinks: sub.raw('coalesce(showSocialLinks, true)', z.boolean()),
    showRole: sub.raw('coalesce(showRole, true)', z.boolean()),
    showBio: sub.raw('coalesce(showBio, true)', z.boolean()),
    author: sub.field('author').deref().project(personDetailFragment).notNull(),
    ...ctaButtonsFragment,
    contentPositionSplit: sub.field('contentPositionSplit').nullable(true),
    contentPositionBanner: sub.field('contentPositionBanner').nullable(true),
    ...moduleContentAlignmentFragment,
    mediaOrderSplit: sub.field('mediaOrderSplit').nullable(true),
    ...moduleHeroLayoutFragment,
  }))
  .notNull();
