import { q } from '#/sanity/query';
import {
  imageWithAltFragment,
  sanityImageFragment,
} from '#/shared/fragments/image';
import { linkFragment } from '#/shared/fragments/link';
import { postCardFragment } from '#/shared/fragments/post';

export const heroModuleQuery = q
  .parameters<{ id: string }>()
  .star.filterByType('module_hero')
  .filterRaw('_id == $id')
  .slice(0)
  .project((sub) => ({
    featuredPost: sub
      .field('featuredPost')
      .deref()
      .project(postCardFragment)
      .nullable(true),
    heroEyebrowMode: sub.field('heroEyebrowMode').notNull(),
    heroEyebrow: sub.field('heroEyebrow').nullable(true),
    heroTitleMode: sub.field('heroTitleMode').notNull(),
    heroTitle: sub.field('heroTitle').nullable(true),
    heroSubtitleMode: sub.field('heroSubtitleMode').notNull(),
    heroSubtitle: sub.field('heroSubtitle').nullable(true),
    heroImageMode: sub.field('heroImageMode').notNull(),
    heroImage: sub
      .field('heroImage')
      .project(imageWithAltFragment)
      .nullable(true),
    heroImageAsset: sub
      .field('heroImage')
      .project(sanityImageFragment)
      .nullable(true),
    primaryActionLabel: sub.field('primaryActionLabel').nullable(true),
    secondaryAction: sub
      .field('secondaryAction')
      .project(linkFragment)
      .nullable(true),
  }))
  .notNull();
