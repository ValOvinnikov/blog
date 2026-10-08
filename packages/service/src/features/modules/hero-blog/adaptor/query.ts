import { POST_SOURCE } from '@blog/config';
import { q, type TModuleQueryParams } from '@blog/service/sanity/query/query';
import { FEATURED_POST_FILTER } from '@blog/service/shared/expressions/post/featured-post';
import { ctaSecondaryButtonFragment } from '@blog/service/shared/fragments/cta/cta-button';
import { localizedImageWithAltFragment } from '@blog/service/shared/fragments/image/localized-image-with-alt';
import { optionalImage } from '@blog/service/shared/fragments/image/optional-image';
import { moduleHeroLayoutFragment } from '@blog/service/shared/fragments/layout/layout';
import { moduleContentAlignmentFragment } from '@blog/service/shared/fragments/module/module-content-alignment';
import { postCardFragment } from '@blog/service/shared/fragments/post/post';
import { getLocalizedField } from '@blog/service/shared/localization/get-localized-field/get-localized-field';
import type { TLocaleQueryParams } from '@blog/service/shared/localization/locale-query-params/locale-query-params';
import { pinnedPostInLocale } from '@blog/service/shared/localization/pinned-post-in-locale/pinned-post-in-locale';
import { publishedPostsInLocale } from '@blog/service/shared/localization/published-posts-in-locale/published-posts-in-locale';

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
    eyebrow: getLocalizedField(sub, 'eyebrow'),
    image: optionalImage(sub, 'image', localizedImageWithAltFragment),
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
