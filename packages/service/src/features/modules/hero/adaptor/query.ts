import { q } from '@blog/service/sanity/query';
import { ctaActionRefFragment } from '@blog/service/shared/fragments/action-group';
import { sanityImageFragment } from '@blog/service/shared/fragments/image';
import { heroLayoutFragment } from '@blog/service/shared/fragments/layout';
import { postCardFragment } from '@blog/service/shared/fragments/post';

export const heroModuleQuery = q
  .parameters<{ id: string }>()
  .star.filterByType('module_hero')
  .filterRaw('_id == $id')
  .slice(0)
  .project((sub) => ({
    brandVariant: sub.field('brandVariant').notNull(),
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
    heroImageAsset: sub
      .field('heroImage')
      .project(sanityImageFragment)
      .nullable(true),
    primaryActionLabel: sub.field('primaryActionLabel').nullable(true),
    // Capped to a single item by the schema (`postHeroActionsField`), so
    // index 0 is the secondary action.
    actions: sub
      .field('actions[]')
      .project(ctaActionRefFragment)
      .nullable(true),
    layout: sub.field('layout').project(heroLayoutFragment).nullable(true),
  }))
  .notNull();
