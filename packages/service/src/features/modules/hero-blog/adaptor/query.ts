import { POST_SOURCE } from '@blog/config';
import { q } from '@blog/service/sanity/query';
import { PUBLISHED_POST_FILTER } from '@blog/service/shared/filters/published-post';
import { ctaButtonFragment } from '@blog/service/shared/fragments/cta-button';
import { sanityImageFragment } from '@blog/service/shared/fragments/image';
import { heroLayoutFragment } from '@blog/service/shared/fragments/layout';
import { postCardFragment } from '@blog/service/shared/fragments/post';

const newestFeaturedPostQuery = q.star
  .filterByType('page_post')
  .filterRaw('featured == true')
  .filterRaw(PUBLISHED_POST_FILTER)
  .order('publishedAt desc')
  .slice(0)
  .project(postCardFragment)
  .nullable(true);

export const heroBlogModuleQuery = q
  .parameters<{ id: string }>()
  .star.filterByType('module_heroBlog')
  .filterRaw('_id == $id')
  .slice(0)
  .project((sub) => ({
    // `select()`, not `coalesce()` — the branch must follow `postSource`,
    // not the pinned reference's emptiness, or an editor's deliberate
    // `NEWEST_FEATURED` choice would silently render a stale pinned post.
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
    imageSource: sub.field('imageSource').notNull(),
    image: sub.field('image').project(sanityImageFragment).nullable(true),
    primaryActionLabel: sub.field('primaryActionLabel').nullable(true),
    primaryActionAppearance: sub
      .field('primaryActionAppearance')
      .nullable(true),
    ctaButtons: sub
      .field('ctaButtons[]')
      .project(ctaButtonFragment)
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
