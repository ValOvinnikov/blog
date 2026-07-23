import { HERO_FIELD_MODE, routes } from '@blog/config';
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

const DEFAULT_PRIMARY_ACTION_LABEL = 'Read more';

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
        : heroPost?.heroImageSanity;

  return {
    eyebrow: getCustomOrFallback(
      raw.heroEyebrowMode,
      raw.heroEyebrow,
      heroPost?.categories[0]?.title,
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
    primaryAction: heroPost
      ? {
          label: raw.primaryActionLabel ?? DEFAULT_PRIMARY_ACTION_LABEL,
          href: routes.post(heroPost.slug),
          target: undefined,
          platform: undefined,
        }
      : undefined,
    secondaryAction: toLink(raw.secondaryAction),
  };
}
