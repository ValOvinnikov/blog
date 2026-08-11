import { HERO_FIELD_MODE, routes } from '@blog/config';
import { toAppearance } from '@blog/service/shared/transformers/to-appearance';
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
    brandVariant: raw.brandVariant,
    eyebrow: getCustomOrFallback(
      raw.heroEyebrowMode,
      raw.heroEyebrow,
      heroPost?.category?.title,
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
          // Lighthouse's SEO link-text audit reads the link's visible text
          // content, not `aria-label` — an `aria-label` on the generic
          // fallback label doesn't satisfy it. Only the fallback label needs
          // a descriptive suffix; an editor-authored label is trusted as
          // already descriptive. Uses the linked post's own title, not
          // `title` above, since that can be an editor-overridden hero title
          // that no longer matches the post the CTA actually links to. The
          // web layer renders this as visually-hidden (sr-only) text
          // appended to the visible label, so it counts as link text.
          hiddenLabelSuffix: raw.primaryActionLabel
            ? undefined
            : heroPost.title,
        }
      : undefined,
    secondaryAction: toLink(raw.secondaryAction),
    appearance: toAppearance(raw.appearance),
  };
}
