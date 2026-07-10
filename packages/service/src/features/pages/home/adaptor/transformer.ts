import type { InferResultType } from 'groqd';

import { buildImageUrl } from '#/shared/transformers/build-image-url';
import { toLink } from '#/shared/transformers/to-link';
import { toPostCard } from '#/shared/transformers/to-post-card';
import { toSanityImage } from '#/shared/transformers/to-sanity-image';
import { toSeoMeta } from '#/shared/transformers/to-seo-meta';

import type { homePagePostsQuery, homePageQuery } from './query';
import type { THomePage } from './types';

type TRawHomePage = InferResultType<typeof homePageQuery>;
type TRawHomePagePosts = InferResultType<typeof homePagePostsQuery>;

const DEFAULT_PRIMARY_ACTION_LABEL = 'Read more';
const DEFAULT_LATEST_POSTS_TITLE = 'Latest';
const DEFAULT_LATEST_POSTS_LIMIT = 6;

function getCustomOrFallback(
  mode: string | null | undefined,
  customValue: string | null | undefined,
  customMode: string,
  fallbackValue: string | undefined,
) {
  if (mode === customMode && customValue) {
    return customValue;
  }

  return fallbackValue;
}

export function toHomePage(
  rawHome: TRawHomePage,
  rawPosts: TRawHomePagePosts,
): THomePage {
  const posts = rawPosts.map(toPostCard);
  const configuredFeaturedPost = rawHome?.featuredPost
    ? toPostCard(rawHome.featuredPost)
    : undefined;
  const heroPost =
    configuredFeaturedPost ?? posts.find((post) => post.featured);

  const heroImageUrl =
    rawHome?.heroImageMode === 'custom'
      ? buildImageUrl(rawHome.heroImage)
      : rawHome?.heroImageMode === 'none'
        ? undefined
        : heroPost?.mainImageUrl;

  const heroImage =
    heroImageUrl && rawHome?.heroImageMode === 'custom' && rawHome.heroImage
      ? { src: heroImageUrl, alt: rawHome.heroImage.alt }
      : heroImageUrl && heroPost
        ? { src: heroImageUrl, alt: heroPost.mainImageAlt }
        : undefined;

  const heroSanityImage =
    rawHome?.heroImageMode === 'custom'
      ? toSanityImage(rawHome.heroImageAsset)
      : rawHome?.heroImageMode === 'none'
        ? undefined
        : heroPost?.mainImageSanity;

  const latestPostsLimit =
    rawHome?.latestPostsLimit ?? DEFAULT_LATEST_POSTS_LIMIT;

  return {
    hero: {
      eyebrow: getCustomOrFallback(
        rawHome?.heroEyebrowMode,
        rawHome?.heroEyebrow,
        'custom',
        heroPost?.categories[0]?.title,
      ),
      title:
        getCustomOrFallback(
          rawHome?.heroTitleMode,
          rawHome?.heroTitle,
          'custom',
          heroPost?.title,
        ) ??
        rawHome?.title ??
        'Home',
      subtitle: getCustomOrFallback(
        rawHome?.heroSubtitleMode,
        rawHome?.heroSubtitle,
        'custom',
        heroPost?.excerpt,
      ),
      image: heroImage,
      sanityImage: heroSanityImage,
      primaryAction: heroPost
        ? {
            label: rawHome?.primaryActionLabel ?? DEFAULT_PRIMARY_ACTION_LABEL,
            href: `/blog/${heroPost.slug}`,
            target: undefined,
            platform: undefined,
          }
        : undefined,
      secondaryAction: toLink(rawHome?.secondaryAction),
    },
    latestPostsTitle: rawHome?.latestPostsTitle ?? DEFAULT_LATEST_POSTS_TITLE,
    latestPosts: posts
      .filter((post) => post.id !== heroPost?.id)
      .slice(0, latestPostsLimit),
    seo: rawHome?.seo ? toSeoMeta(rawHome.seo) : undefined,
  };
}
