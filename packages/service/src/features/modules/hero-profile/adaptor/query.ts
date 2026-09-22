import { q } from '@blog/service/sanity/query';
import { authorDetailFragment } from '@blog/service/shared/fragments/author/author';
import { ctaButtonFragment } from '@blog/service/shared/fragments/cta/cta-button';
import { headingBlockFragment } from '@blog/service/shared/fragments/heading-block/heading-block';
import { sanityImageFragment } from '@blog/service/shared/fragments/image/image';
import { heroLayoutFragment } from '@blog/service/shared/fragments/layout/layout';
import { z } from 'zod';

export const heroProfileModuleQuery = q
  .parameters<{ id: string }>()
  .star.filterByType('module_heroProfile')
  .filterRaw('_id == $id')
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
    author: sub.field('author').deref().project(authorDetailFragment).notNull(),
    ctaButtons: sub
      .field('ctaButtons[]')
      .project(ctaButtonFragment)
      .nullable(true),
    contentPositionSplit: sub.field('contentPositionSplit').nullable(true),
    contentPositionBanner: sub.field('contentPositionBanner').nullable(true),
    contentAlignment: sub.field('contentAlignment').nullable(true),
    mediaOrderSplit: sub.field('mediaOrderSplit').nullable(true),
    layout: sub.field('layout').project(heroLayoutFragment).nullable(true),
  }))
  .notNull();
