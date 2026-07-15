import type { TSiteSettings } from '@blog/service/features/global/site-settings/adaptor/types';
import { resolveSeo } from '@blog/service/shared/transformers/resolve-seo';
import { toPostCard } from '@blog/service/shared/transformers/to-post-card';
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
        // defaultOgImage is CMS-required (schema validation), but buildImageUrl's
        // signature can't express that non-nullability — the asset is always
        // present in practice.
        defaultOgImageUrl: settings.defaultOgImageUrl as string,
      },
    ),
    posts: rawPosts.posts.map(toPostCard),
    currentPage,
    totalPages: toTotalPages(rawPosts.total, pageSize),
    total: rawPosts.total,
  };
}
