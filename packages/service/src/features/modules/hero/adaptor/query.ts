import { q, type TModuleQueryParams } from '@blog/service/sanity/query/query';
import { sanityImageFragment } from '@blog/service/shared/fragments/image/image';
import { optionalImage } from '@blog/service/shared/fragments/image/optional-image';
import { moduleHeroLayoutFragment } from '@blog/service/shared/fragments/layout/layout';
import { inlineLinkFragment } from '@blog/service/shared/fragments/link/inline-link';
import { pinnedPostInLocale } from '@blog/service/shared/localization/pinned-post-in-locale/pinned-post-in-locale';

export const heroModuleQuery = q
  .parameters<TModuleQueryParams>()
  .star.filterByType('module_hero')
  .filterBy('_id == $id')
  .slice(0)
  .project((sub) => ({
    brandVariant: sub.field('brandVariant').notNull(),
    featuredPost: pinnedPostInLocale(sub, sub.field('featuredPost')).nullable(
      true,
    ),
    heroEyebrowMode: sub.field('heroEyebrowMode').notNull(),
    heroEyebrow: sub.field('heroEyebrow').nullable(true),
    heroTitleMode: sub.field('heroTitleMode').notNull(),
    heroTitle: sub.field('heroTitle').nullable(true),
    heroSubtitleMode: sub.field('heroSubtitleMode').notNull(),
    heroSubtitle: sub.field('heroSubtitle').nullable(true),
    heroImageMode: sub.field('heroImageMode').notNull(),
    heroImageAsset: optionalImage(sub, 'heroImage', sanityImageFragment),
    primaryActionLabel: sub.field('primaryActionLabel').nullable(true),
    secondaryAction: sub
      .field('secondaryAction')
      .project(inlineLinkFragment)
      .nullable(true),
    ...moduleHeroLayoutFragment,
  }))
  .notNull();
