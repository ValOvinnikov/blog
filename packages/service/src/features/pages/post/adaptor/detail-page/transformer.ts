import type { TMaybeUndefined } from '@blog/config';
import type { TSiteSettings } from '@blog/service/features/global/site-settings/adaptor/types';
import { buildImageUrl } from '@blog/service/shared/transformers/build-image-url';
import { resolveSeo } from '@blog/service/shared/transformers/resolve-seo';
import type { TPostCard } from '@blog/service/shared/transformers/to-post-card';
import { toSanityImage } from '@blog/service/shared/transformers/to-sanity-image';
import { toSocialLink } from '@blog/service/shared/transformers/to-social-link';
import { toTag } from '@blog/service/shared/transformers/to-tag';
import { toTopic } from '@blog/service/shared/transformers/to-topic';
import { toReadingTimeMinutes } from '@blog/utils';
import type { InferResultType } from 'groqd';

import type { postPageQuery } from './query';
import type { TPostDetail, TPostDetailAuthor, TPostSkim } from './types';

export type TRawPostPage = NonNullable<InferResultType<typeof postPageQuery>>;
export type TRawPostDetail = TRawPostPage['post'];

// PostMeta renders the author avatar at Size.SM (32px, `avatar-variants.ts`)
// — 64px covers a 2x DPR display without serving the source asset's full
// natural resolution.
const AUTHOR_AVATAR_SIZE_PX = 64;

function toPostDetailAuthor(raw: TRawPostDetail['author']): TPostDetailAuthor {
  return {
    id: raw._id,
    name: raw.name,
    profilePageSlug: raw.profilePage?.slug ?? undefined,
    imageUrl: buildImageUrl(raw.image, {
      width: AUTHOR_AVATAR_SIZE_PX,
      height: AUTHOR_AVATAR_SIZE_PX,
      fit: 'crop',
      quality: 75,
    }),
    role: raw.role ?? undefined,
    bio: raw.bio ?? undefined,
    socialLinks: (raw.socialLinks ?? []).map(toSocialLink),
  };
}

// Mirrors the schema's own `min(3)` takeaways rule (`skim.ts`) — fewer than
// 3 takeaways is treated the same as no `skim` at all, never a partial list.
function toPostSkim(raw: TRawPostDetail['skim']): TMaybeUndefined<TPostSkim> {
  if (!raw?.takeaways || raw.takeaways.length < 3) return undefined;

  return {
    takeaways: raw.takeaways,
    generatedAt: raw.generatedAt ?? undefined,
    model: raw.model ?? undefined,
  };
}

export function toPostDetail(
  rawPage: TRawPostPage,
  settings: TSiteSettings,
  relatedPosts: TPostCard[],
): TPostDetail {
  const raw = rawPage.post;
  const heroImageUrl = buildImageUrl(raw.heroImage);

  return {
    id: raw._id,
    title: raw.title,
    // `page_post`'s own slug/publishedAt, not `post`'s — that's the field
    // this migration moves reads off of.
    slug: rawPage.slug,
    excerpt: raw.excerpt,
    publishedAt: rawPage.publishedAt,
    heroImageUrl,
    heroImageAlt: raw.heroImage?.alt,
    heroImageSanity: toSanityImage(raw.heroImageAsset),
    featured: raw.featured ?? false,
    // Schema default is `initialValue: true` (studio-only, not a stored
    // fallback) — the migration backfilled every existing post's stored
    // value to `true`, so `?? true` here only covers a theoretical
    // unmigrated row, mirroring `featured`'s own `?? false` shape.
    newsletterEnabled: raw.newsletterEnabled ?? true,
    body: raw.body,
    skim: toPostSkim(raw.skim),
    // `_type: 'aside'` is the schema's own registered block name (`apps/cms/src/schema-types/objects/aside.ts`),
    // matching how `.filterByType('blog_post')`/module queries elsewhere in
    // this package match against a document's own `_type` literal.
    hasAsides: raw.body.some((block) => block._type === 'aside'),
    // `page_post.seo` is the override — mirrors `page_topic`/`page_blog`,
    // whose own `.seo` overrides a content-derived fallback, not the wrapped
    // entity's own `seo` field.
    seo: resolveSeo(
      rawPage.seo ?? undefined,
      { title: raw.title, description: raw.excerpt, imageUrl: heroImageUrl },
      {
        description: settings.description,
        defaultOgImageUrl: settings.defaultOgImageUrl,
      },
    ),
    author: toPostDetailAuthor(raw.author),
    topic: toTopic(raw.topic),
    tags: (raw.tags ?? []).map(toTag),
    relatedPosts,
    readingTimeMinutes: toReadingTimeMinutes(raw.wordCount),
  };
}
