import { buildImageUrl } from '@blog/service/shared/transformers/build-image-url';
import { toArchivePostCard } from '@blog/service/shared/transformers/to-archive-post-card';
import { toSocialLink } from '@blog/service/shared/transformers/to-social-link';
import type { InferResultType } from 'groqd';

import type { authorPageAuthorQuery } from './author.query';
import type { buildAuthorPostsPageQuery } from './posts.query';
import type { TAuthorDetail, TAuthorPage } from './types';

export type TRawAuthor = NonNullable<
  InferResultType<typeof authorPageAuthorQuery>
>;
type TRawPosts = InferResultType<
  ReturnType<typeof buildAuthorPostsPageQuery>
>['posts'];

export type TAuthorPagePagination = {
  currentPage: number;
  totalPages: number;
};

// Avatar renders at Size.LG (56px, `avatar-variants.ts`) — 112px covers a
// 2x DPR display without serving the source asset's full natural resolution.
const AUTHOR_AVATAR_SIZE_PX = 112;

function toAuthorDetail(raw: TRawAuthor): TAuthorDetail {
  return {
    id: raw._id,
    name: raw.name,
    slug: raw.slug,
    role: raw.role ?? undefined,
    imageUrl: buildImageUrl(raw.image, {
      width: AUTHOR_AVATAR_SIZE_PX,
      height: AUTHOR_AVATAR_SIZE_PX,
      fit: 'crop',
      quality: 75,
    }),
    // Untransformed URL for the author page's OG/Twitter card — the social
    // card is not the on-page avatar, so it keeps its own, unsized source.
    ogImageUrl: buildImageUrl(raw.image),
    bio: raw.bio ?? undefined,
    socialLinks: (raw.socialLinks ?? []).map(toSocialLink),
  };
}

export function toAuthorPage(
  rawAuthor: TRawAuthor,
  rawPosts: TRawPosts,
  pagination: TAuthorPagePagination,
): TAuthorPage {
  return {
    author: toAuthorDetail(rawAuthor),
    posts: rawPosts.map(toArchivePostCard),
    currentPage: pagination.currentPage,
    totalPages: pagination.totalPages,
  };
}
