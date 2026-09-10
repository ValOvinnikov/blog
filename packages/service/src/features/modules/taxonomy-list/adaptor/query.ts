import { TAXONOMY_KIND, TAXONOMY_SORT, type TTaxonomyKind } from '@blog/config';
import { q } from '@blog/service/sanity/query';
import { PUBLISHED_POST_FILTER } from '@blog/service/shared/filters/published-post';
import { headingBlockFragment } from '@blog/service/shared/fragments/heading-block';
import { layoutFragment } from '@blog/service/shared/fragments/layout';
import {
  POST_COUNT_EXPRESSION,
  postCountParser,
} from '@blog/service/shared/fragments/post-count';
import { postLinkFragment } from '@blog/service/shared/fragments/post-link';
import { tagFragment } from '@blog/service/shared/fragments/tag';
import { topicFragment } from '@blog/service/shared/fragments/topic';
import { z } from 'zod';

const RESOLVED_TAXONOMY_EXPRESSION = 'coalesce(taxonomy, $fallbackTaxonomy)';

const LATEST_POSTS_LIMIT = 2;

const resolvedTaxonomyParser = z
  .enum([TAXONOMY_KIND.TOPICS, TAXONOMY_KIND.TAGS])
  .nullable();

const resolvedSortOrderParser = z.enum([
  TAXONOMY_SORT.ALPHABETICAL,
  TAXONOMY_SORT.MOST_POSTS,
]);

const showLatestPostsParser = z.boolean();

const topicEntriesQuery = q.star
  .filterByType('blog_topic')
  .order('title asc')
  .project((sub) => ({
    ...topicFragment,
    postCount: sub.raw(POST_COUNT_EXPRESSION, postCountParser),
    latestPosts: sub.star
      .filterByType('page_post')
      .filterRaw('references(^._id)')
      .filterRaw(PUBLISHED_POST_FILTER)
      .order('publishedAt desc')
      .slice(0, LATEST_POSTS_LIMIT)
      .project(postLinkFragment),
  }));

const tagEntriesQuery = q.star
  .filterByType('blog_tag')
  .order('title asc')
  .project((sub) => ({
    ...tagFragment,
    description: sub.field('description').nullable(true),
    postCount: sub.raw(POST_COUNT_EXPRESSION, postCountParser),
    latestPosts: sub.star
      .filterByType('page_post')
      .filterRaw('references(^._id)')
      .filterRaw(PUBLISHED_POST_FILTER)
      .order('publishedAt desc')
      .slice(0, LATEST_POSTS_LIMIT)
      .project(postLinkFragment),
  }));

export const taxonomyListModuleQuery = q
  .parameters<{ id: string; fallbackTaxonomy: TTaxonomyKind | null }>()
  .star.filterByType('module_taxonomyList')
  .filterRaw('_id == $id')
  .slice(0)
  .project((sub) => ({
    brandVariant: sub.field('brandVariant').notNull(),
    headingBlock: sub
      .field('headingBlock')
      .project(headingBlockFragment)
      .nullable(true),
    layout: sub.field('layout').project(layoutFragment).nullable(true),
    contentAlignment: sub.field('contentAlignment').nullable(true),
    taxonomy: sub.raw(RESOLVED_TAXONOMY_EXPRESSION, resolvedTaxonomyParser),
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
      [`${RESOLVED_TAXONOMY_EXPRESSION} == "${TAXONOMY_KIND.TOPICS}"`]:
        topicEntriesQuery,
      [`${RESOLVED_TAXONOMY_EXPRESSION} == "${TAXONOMY_KIND.TAGS}"`]:
        tagEntriesQuery,
    }),
  }))
  .notNull();
