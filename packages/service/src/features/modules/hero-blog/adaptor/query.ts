import { POST_SOURCE } from '@shinefold/config';
import {
  q,
  type TModuleQueryParams,
} from '@shinefold/service/sanity/query/query';
import { FEATURED_POST_FILTER } from '@shinefold/service/shared/expressions/post/featured-post';
import { ctaSecondaryButtonFragment } from '@shinefold/service/shared/fragments/cta/cta-button';
import { localizedImageWithAltOptionalFragment } from '@shinefold/service/shared/fragments/image/localized-image-with-alt';
import { moduleHeroLayoutFragment } from '@shinefold/service/shared/fragments/layout/layout';
import { moduleContentAlignmentFragment } from '@shinefold/service/shared/fragments/module/module-content-alignment';
import { postCardFragment } from '@shinefold/service/shared/fragments/post/post';
import { getLocalizedField } from '@shinefold/service/shared/localization/get-localized-field/get-localized-field';
import type { TLocaleQueryParams } from '@shinefold/service/shared/localization/locale-query-params/locale-query-params';
import { pinnedPostInLocale } from '@shinefold/service/shared/localization/pinned-post-in-locale/pinned-post-in-locale';
import { publishedPostsInLocale } from '@shinefold/service/shared/localization/published-posts-in-locale/published-posts-in-locale';

const newestFeaturedPostQuery = publishedPostsInLocale(
  q.parameters<TLocaleQueryParams>().star,
)
  .filterRaw(FEATURED_POST_FILTER)
  .order('publishedAt desc')
  .slice(0)
  .project(postCardFragment)
  .nullable(true);

export const heroBlogModuleQuery = q
  .parameters<TModuleQueryParams>()
  .star.filterByType('module_heroBlog')
  .filterBy('_id == $id')
  .slice(0)
  .project((sub) => ({
    post: sub
      .select(
        {
          [`postSource == "${POST_SOURCE.PINNED}"`]: pinnedPostInLocale(
            sub,
            sub.field('post'),
          ).nullable(true),
        },
        newestFeaturedPostQuery,
      )
      .nullable(true),
    hasPinnedPost: sub.raw<boolean>(
      `postSource == "${POST_SOURCE.PINNED}" && defined(post->)`,
    ),
    eyebrow: getLocalizedField(sub, 'eyebrow'),
    image: sub
      .field('image')
      .project(localizedImageWithAltOptionalFragment)
      .nullable(true),
    primaryActionLabel: getLocalizedField(sub, 'primaryActionLabel').notNull(),
    primaryActionAppearance: sub.field('primaryActionAppearance').notNull(),
    secondaryAction: sub
      .field('secondaryAction')
      .project(ctaSecondaryButtonFragment)
      .nullable(true),
    variant: sub.field('variant').notNull(),
    brandVariant: sub.field('brandVariant').notNull(),
    contentPositionSplit: sub.field('contentPositionSplit').nullable(true),
    contentPositionBanner: sub.field('contentPositionBanner').nullable(true),
    ...moduleContentAlignmentFragment,
    mediaOrderSplit: sub.field('mediaOrderSplit').nullable(true),
    mediaOrderStacked: sub.field('mediaOrderStacked').nullable(true),
    ...moduleHeroLayoutFragment,
  }))
  .notNull();
