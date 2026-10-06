import { TAXONOMY_KIND, TAXONOMY_SORT } from '@blog/config';
import { q, type TModuleQueryParams } from '@blog/service/sanity/query/query';
import { POST_IN_LOCALE_FILTER } from '@blog/service/shared/expressions/post/post-in-locale';
import { PUBLISHED_POST_FILTER } from '@blog/service/shared/expressions/post/published-post';
import { moduleHeadingBlockFragment } from '@blog/service/shared/fragments/heading-block/module-heading-block';
import { moduleWideLayoutFragment } from '@blog/service/shared/fragments/layout/layout';
import { moduleContentAlignmentFragment } from '@blog/service/shared/fragments/module/module-content-alignment';
import { postLinkFragment } from '@blog/service/shared/fragments/post/post-link';
import { tagWithPostCountFragment } from '@blog/service/shared/fragments/tag/tag';
import { topicWithPostCountFragment } from '@blog/service/shared/fragments/topic/topic';
import { z } from 'zod';

const LATEST_POSTS_LIMIT = 2;

const taxonomyParser = z
  .enum([TAXONOMY_KIND.TOPICS, TAXONOMY_KIND.TAGS])
  .nullable();

const resolvedSortOrderParser = z.enum([
  TAXONOMY_SORT.ALPHABETICAL,
  TAXONOMY_SORT.MOST_POSTS,
]);

const showLatestPostsParser = z.boolean();

const topicEntriesQuery = q.star
  .filterByType('blog_topic')
  .project((sub) => ({
    ...topicWithPostCountFragment,
    latestPosts: sub.star
      .filterByType('page_post')
      .filterRaw('references(^._id)')
      .filterRaw(POST_IN_LOCALE_FILTER)
      .filterRaw(PUBLISHED_POST_FILTER)
      .order('publishedAt desc')
      .slice(0, LATEST_POSTS_LIMIT)
      .project(postLinkFragment),
  }))
  .order('title asc');

const tagEntriesQuery = q.star
  .filterByType('blog_tag')
  .project((sub) => ({
    ...tagWithPostCountFragment,
    latestPosts: sub.star
      .filterByType('page_post')
      .filterRaw('references(^._id)')
      .filterRaw(POST_IN_LOCALE_FILTER)
      .filterRaw(PUBLISHED_POST_FILTER)
      .order('publishedAt desc')
      .slice(0, LATEST_POSTS_LIMIT)
      .project(postLinkFragment),
  }))
  .order('title asc');

export const taxonomyListModuleQuery = q
  .parameters<TModuleQueryParams>()
  .star.filterByType('module_taxonomyList')
  .filterBy('_id == $id')
  .slice(0)
  .project((sub) => ({
    brandVariant: sub.field('brandVariant').notNull(),
    headingBlock: sub
      .field('headingBlock')
      .project(moduleHeadingBlockFragment)
      .notNull(),
    ...moduleWideLayoutFragment,
    ...moduleContentAlignmentFragment,
    taxonomy: sub.raw('taxonomy', taxonomyParser),
    sortOrder: sub.raw(
      `coalesce(sortOrder, "${TAXONOMY_SORT.ALPHABETICAL}")`,
      resolvedSortOrderParser,
    ),
    limit: sub.field('limit').nullable(true),
    showLatestPosts: sub.raw(
      'coalesce(showLatestPosts, true)',
      showLatestPostsParser,
    ),
    entries: sub.select({
      [`taxonomy == "${TAXONOMY_KIND.TOPICS}"`]: topicEntriesQuery,
      [`taxonomy == "${TAXONOMY_KIND.TAGS}"`]: tagEntriesQuery,
    }),
  }))
  .notNull();
