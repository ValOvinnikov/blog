import { POST_SOURCE } from '@blog/config';
import { q, type TIdParams } from '@blog/service/sanity/query';
import { PUBLISHED_POST_FILTER } from '@blog/service/shared/expressions/published-post';
import { ctaSecondaryButtonFragment } from '@blog/service/shared/fragments/cta/cta-button';
import { sanityImageFragment } from '@blog/service/shared/fragments/image/image';
import { heroLayoutFragment } from '@blog/service/shared/fragments/layout/layout';
import { postCardFragment } from '@blog/service/shared/fragments/post/post';

const newestFeaturedPostQuery = q.star
  .filterByType('page_post')
  .filterRaw('featured == true')
  .filterRaw(PUBLISHED_POST_FILTER)
  .order('publishedAt desc')
  .slice(0)
  .project(postCardFragment)
  .nullable(true);

export const heroBlogModuleQuery = q
  .parameters<TIdParams>()
  .star.filterByType('module_heroBlog')
  .filterBy('_id == $id')
  .slice(0)
  .project((sub) => ({
    post: sub
      .select(
        {
          [`postSource == "${POST_SOURCE.PINNED}"`]: sub
            .field('post')
            .deref()
            .project(postCardFragment)
            .nullable(true),
        },
        newestFeaturedPostQuery,
      )
      .nullable(true),
    eyebrow: sub.field('eyebrow').nullable(true),
    image: sub.field('image').project(sanityImageFragment).nullable(true),
    primaryActionLabel: sub.field('primaryActionLabel').notNull(),
    primaryActionAppearance: sub.field('primaryActionAppearance').notNull(),
    secondaryAction: sub
      .field('secondaryAction')
      .project(ctaSecondaryButtonFragment)
      .nullable(true),
    variant: sub.field('variant').notNull(),
    brandVariant: sub.field('brandVariant').notNull(),
    contentPositionSplit: sub.field('contentPositionSplit').nullable(true),
    contentPositionBanner: sub.field('contentPositionBanner').nullable(true),
    contentAlignment: sub.field('contentAlignment').nullable(true),
    mediaOrderSplit: sub.field('mediaOrderSplit').nullable(true),
    mediaOrderStacked: sub.field('mediaOrderStacked').nullable(true),
    layout: sub.field('layout').project(heroLayoutFragment).nullable(true),
  }))
  .notNull();
