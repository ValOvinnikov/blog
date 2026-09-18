import { q } from '@blog/service/sanity/query';
import { ctaButtonFragment } from '@blog/service/shared/fragments/cta-button';
import { headingBlockFragment } from '@blog/service/shared/fragments/heading-block';
import { sanityImageFragment } from '@blog/service/shared/fragments/image';
import { heroLayoutFragment } from '@blog/service/shared/fragments/layout';
import { socialProfileFragment } from '@blog/service/shared/fragments/social-profile';
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
    imageSource: sub.field('imageSource').notNull(),
    image: sub.field('image').project(sanityImageFragment).nullable(true),
    showSocialLinks: sub.raw('coalesce(showSocialLinks, true)', z.boolean()),
    author: sub
      .field('author')
      .deref()
      .project((authorSub) => ({
        image: authorSub
          .field('image')
          .project(sanityImageFragment)
          .nullable(true),
        socialLinks: authorSub
          .field('socialLinks[]')
          .project(socialProfileFragment)
          .nullable(true),
      }))
      .notNull(),
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
