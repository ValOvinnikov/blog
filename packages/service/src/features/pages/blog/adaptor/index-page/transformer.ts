import type { TSiteSettings } from '@blog/service/features/global/site-settings/adaptor/types';
import { resolveSeo } from '@blog/service/shared/transformers/resolve-seo';
import { toArchivePostCard } from '@blog/service/shared/transformers/to-archive-post-card';
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
  settings: TSiteSettings,
  currentPage: number,
  pageSize: number,
): TBlogIndexPage {
  return {
    heading: rawPage.heading,
    supportingText: rawPage.supportingText ?? undefined,
    seo: resolveSeo(
      rawPage.seo ?? undefined,
      { title: rawPage.heading },
      {
        description: settings.description,
        defaultOgImageUrl: settings.defaultOgImageUrl,
      },
    ),
    posts: rawPosts.posts.map(toArchivePostCard),
    currentPage,
    totalPages: toTotalPages(rawPosts.total, pageSize),
  };
}
