import { toPostCard } from '@blog/service/shared/transformers/to-post-card';
import { toSeoMeta } from '@blog/service/shared/transformers/to-seo-meta';
import { toTotalPages } from '@blog/utils';
import type { InferResultType } from 'groqd';

import type { blogPageQuery, buildIndexPageQuery } from './query';
import type { TBlogIndexPage } from './types';

export type TRawBlogPage = InferResultType<typeof blogPageQuery>;
export type TRawBlogIndexPosts = InferResultType<
  ReturnType<typeof buildIndexPageQuery>
>;

export function toIndexPage(
  rawPage: TRawBlogPage,
  rawPosts: TRawBlogIndexPosts,
  currentPage: number,
  pageSize: number,
): TBlogIndexPage {
  return {
    heading: rawPage.heading,
    supportingText: rawPage.supportingText ?? undefined,
    seo: rawPage.seo ? toSeoMeta(rawPage.seo) : undefined,
    posts: rawPosts.posts.map(toPostCard),
    currentPage,
    totalPages: toTotalPages(rawPosts.total, pageSize),
    total: rawPosts.total,
  };
}
