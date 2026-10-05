import { POST_SOURCE } from '@blog/config';
import { q, type TModuleQueryParams } from '@blog/service/sanity/query';
import { PUBLISHED_POST_FILTER } from '@blog/service/shared/expressions/post/published-post';
import { ctaSecondaryButtonFragment } from '@blog/service/shared/fragments/cta/cta-button';
import { localizedImageWithAltFragment } from '@blog/service/shared/fragments/image/localized-image-with-alt';
import { moduleHeroLayoutFragment } from '@blog/service/shared/fragments/layout/layout';
import { moduleContentAlignmentFragment } from '@blog/service/shared/fragments/module/module-content-alignment';
import { postCardFragment } from '@blog/service/shared/fragments/post/post';
import { getLocalizedField } from '@blog/service/shared/localization/get-localized-field/get-localized-field';

const newestFeaturedPostQuery = q.star
  .filterByType('page_post')
  .filterRaw('featured == true')
  .filterRaw(PUBLISHED_POST_FILTER)
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
          [`postSource == "${POST_SOURCE.PINNED}"`]: sub
            .field('post')
            .deref()
            .project(postCardFragment)
            .nullable(true),
        },
        newestFeaturedPostQuery,
      )
      .nullable(true),
    eyebrow: getLocalizedField(sub, 'eyebrow'),
    image: sub
      .field('image')
      .project(localizedImageWithAltFragment)
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
