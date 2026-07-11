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
  const heroModule = rawHome?.modules?.find(
    (module) => module._type === 'module_hero',
  );
  const postListModule = rawHome?.modules?.find(
    (module) => module._type === 'module_postList',
  );

  const posts = rawPosts.map(toPostCard);
  const configuredFeaturedPost = heroModule?.featuredPost
    ? toPostCard(heroModule.featuredPost)
    : undefined;
  const heroPost =
    configuredFeaturedPost ?? posts.find((post) => post.featured);

  const heroImageUrl =
    heroModule?.heroImageMode === 'custom'
      ? buildImageUrl(heroModule.heroImage)
      : heroModule?.heroImageMode === 'none'
        ? undefined
        : heroPost?.mainImageUrl;

  const heroImage =
    heroImageUrl &&
    heroModule?.heroImageMode === 'custom' &&
    heroModule.heroImage
      ? { src: heroImageUrl, alt: heroModule.heroImage.alt }
      : heroImageUrl && heroPost
        ? { src: heroImageUrl, alt: heroPost.mainImageAlt }
        : undefined;

  const heroSanityImage =
    heroModule?.heroImageMode === 'custom'
      ? toSanityImage(heroModule.heroImageAsset)
      : heroModule?.heroImageMode === 'none'
        ? undefined
        : heroPost?.mainImageSanity;

  const latestPostsLimit = postListModule?.limit ?? DEFAULT_LATEST_POSTS_LIMIT;

  return {
    hero: {
      eyebrow: getCustomOrFallback(
        heroModule?.heroEyebrowMode,
        heroModule?.heroEyebrow,
        'custom',
        heroPost?.categories[0]?.title,
      ),
      title:
        getCustomOrFallback(
          heroModule?.heroTitleMode,
          heroModule?.heroTitle,
          'custom',
          heroPost?.title,
        ) ??
        rawHome?.title ??
        'Home',
      subtitle: getCustomOrFallback(
        heroModule?.heroSubtitleMode,
        heroModule?.heroSubtitle,
        'custom',
        heroPost?.excerpt,
      ),
      image: heroImage,
      sanityImage: heroSanityImage,
      primaryAction: heroPost
        ? {
            label:
              heroModule?.primaryActionLabel ?? DEFAULT_PRIMARY_ACTION_LABEL,
            href: `/blog/${heroPost.slug}`,
            target: undefined,
            platform: undefined,
          }
        : undefined,
      secondaryAction: toLink(heroModule?.secondaryAction),
    },
    latestPostsTitle: postListModule?.title ?? DEFAULT_LATEST_POSTS_TITLE,
    latestPosts: posts
      .filter((post) => post.id !== heroPost?.id)
      .slice(0, latestPostsLimit),
    seo: rawHome?.seo ? toSeoMeta(rawHome.seo) : undefined,
  };
}
