import { HERO_FIELD_MODE } from '@blog/config';
import type { TImageTenant } from '@blog/service/sanity/image';
import { toHeroPrimaryAction } from '@blog/service/shared/transformers/to-hero-primary-action';
import { toLayout } from '@blog/service/shared/transformers/to-layout';
import { toLink } from '@blog/service/shared/transformers/to-link';
import { toPostCard } from '@blog/service/shared/transformers/to-post-card';
import { toSanityImage } from '@blog/service/shared/transformers/to-sanity-image';
import type { InferResultType } from 'groqd';

import type { heroFallbackFeaturedPostQuery } from './featured-post.query';
import type { heroModuleQuery } from './query';
import type { THeroModule } from './types';

export type TRawHeroModule = InferResultType<typeof heroModuleQuery>;
export type TRawHeroFallbackPost = InferResultType<
  typeof heroFallbackFeaturedPostQuery
>;

function getCustomOrFallback(
  mode: string | null | undefined,
  customValue: string | null | undefined,
  fallbackValue: string | undefined,
) {
  if (mode === HERO_FIELD_MODE.CUSTOM && customValue) {
    return customValue;
  }

  return fallbackValue;
}

export function toHeroModule(
  raw: TRawHeroModule,
  rawFallbackPost: TRawHeroFallbackPost,
  tenant: TImageTenant,
): THeroModule {
  const configuredFeaturedPost = raw.featuredPost
    ? toPostCard(raw.featuredPost, tenant)
    : undefined;
  const fallbackPost = rawFallbackPost
    ? toPostCard(rawFallbackPost, tenant)
    : undefined;
  const heroPost = configuredFeaturedPost ?? fallbackPost;

  const sanityImage =
    raw.heroImageMode === HERO_FIELD_MODE.CUSTOM
      ? toSanityImage(raw.heroImageAsset, tenant)
      : raw.heroImageMode === HERO_FIELD_MODE.NONE
        ? undefined
        : heroPost?.heroImageSanity;

  return {
    brandVariant: raw.brandVariant,
    eyebrow: getCustomOrFallback(
      raw.heroEyebrowMode,
      raw.heroEyebrow,
      heroPost?.topic?.title,
    ),
    title: getCustomOrFallback(
      raw.heroTitleMode,
      raw.heroTitle,
      heroPost?.title,
    ),
    subtitle: getCustomOrFallback(
      raw.heroSubtitleMode,
      raw.heroSubtitle,
      heroPost?.excerpt,
    ),
    sanityImage,
    // Uses the linked post's own title, not `title` above, since that can
    // be an editor-overridden hero title that no longer matches the post
    // the CTA actually links to.
    primaryAction: toHeroPrimaryAction(raw.primaryActionLabel, heroPost),
    secondaryAction: toLink(raw.secondaryAction),
    layout: toLayout(raw.layout),
  };
}
