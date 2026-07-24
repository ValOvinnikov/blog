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

function toAuthorDetail(raw: TRawAuthor): TAuthorDetail {
  return {
    id: raw._id,
    name: raw.name,
    slug: raw.slug,
    role: raw.role ?? undefined,
    imageUrl: buildImageUrl(raw.image),
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
