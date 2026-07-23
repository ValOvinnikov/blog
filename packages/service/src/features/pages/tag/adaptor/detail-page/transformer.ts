import type { TSiteSettings } from '@blog/service/features/global/site-settings/adaptor/types';
import { resolveSeo } from '@blog/service/shared/transformers/resolve-seo';
import { toArchivePostCard } from '@blog/service/shared/transformers/to-archive-post-card';
import type { InferResultType } from 'groqd';

import type { buildTagPostsPageQuery } from './posts.query';
import type { tagPageTagQuery } from './tag.query';
import type { TTagPage, TTagPageTag } from './types';

export type TRawTagPageTag = NonNullable<
  InferResultType<typeof tagPageTagQuery>
>;
type TRawPosts = InferResultType<
  ReturnType<typeof buildTagPostsPageQuery>
>['posts'];

export type TTagPagePagination = {
  currentPage: number;
  totalPages: number;
};

function toTagPageTag(
  raw: TRawTagPageTag,
  settings: TSiteSettings,
): TTagPageTag {
  const description = raw.description ?? undefined;

  return {
    id: raw._id,
    title: raw.title,
    slug: raw.slug,
    description,
    // The blog_tag schema has no image field, so the content-derived tier
    // only supplies title/description; the OG image falls through to the
    // site default — same fallback shape as `pages/generic`.
    seo: resolveSeo(
      raw.seo ?? undefined,
      { title: raw.title, description },
      {
        description: settings.description,
        defaultOgImageUrl: settings.defaultOgImageUrl,
      },
    ),
  };
}

export function toTagPage(
  rawTag: TRawTagPageTag,
  rawPosts: TRawPosts,
  settings: TSiteSettings,
  pagination: TTagPagePagination,
): TTagPage {
  return {
    tag: toTagPageTag(rawTag, settings),
    posts: rawPosts.map(toArchivePostCard),
    currentPage: pagination.currentPage,
    totalPages: pagination.totalPages,
  };
}
