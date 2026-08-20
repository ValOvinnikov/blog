import { toArchivePostCard } from '@blog/service/shared/transformers/to-archive-post-card';
import { toTopic } from '@blog/service/shared/transformers/to-topic';
import type { InferResultType } from 'groqd';

import type { buildTopicPostsPageQuery } from './posts.query';
import type { topicPageTopicQuery } from './topic.query';
import type { TTopicPage } from './types';

type TRawTopic = NonNullable<InferResultType<typeof topicPageTopicQuery>>;
type TRawPosts = InferResultType<
  ReturnType<typeof buildTopicPostsPageQuery>
>['posts'];

export type TTopicPagePagination = {
  currentPage: number;
  totalPages: number;
};

export function toTopicPage(
  rawTopic: TRawTopic,
  rawPosts: TRawPosts,
  pagination: TTopicPagePagination,
): TTopicPage {
  return {
    topic: toTopic(rawTopic),
    posts: rawPosts.map(toArchivePostCard),
    currentPage: pagination.currentPage,
    totalPages: pagination.totalPages,
  };
}
