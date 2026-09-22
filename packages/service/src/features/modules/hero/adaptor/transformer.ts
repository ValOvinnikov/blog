import { HERO_FIELD_MODE } from '@blog/config';
import { toHeroPrimaryAction } from '@blog/service/shared/transformers/hero/to-hero-primary-action/to-hero-primary-action';
import { toSanityImage } from '@blog/service/shared/transformers/image/to-sanity-image/to-sanity-image';
import { toLayout } from '@blog/service/shared/transformers/layout/to-layout/to-layout';
import { toLink } from '@blog/service/shared/transformers/link/to-link/to-link';
import { toPostCard } from '@blog/service/shared/transformers/post/to-post-card/to-post-card';
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
): THeroModule {
  const configuredFeaturedPost = raw.featuredPost
    ? toPostCard(raw.featuredPost)
    : undefined;
  const fallbackPost = rawFallbackPost
    ? toPostCard(rawFallbackPost)
    : undefined;
  const heroPost = configuredFeaturedPost ?? fallbackPost;

  const sanityImage =
    raw.heroImageMode === HERO_FIELD_MODE.CUSTOM
      ? toSanityImage(raw.heroImageAsset)
      : raw.heroImageMode === HERO_FIELD_MODE.NONE
        ? undefined
        : heroPost?.heroImage;

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
