import { POST_SOURCE } from '@blog/config';
import { q } from '@blog/service/sanity/query';
import {
  POST_CONTENT_READY_FILTER,
  PUBLISHED_POST_FILTER,
} from '@blog/service/shared/filters/published-post';
import { layoutFragment } from '@blog/service/shared/fragments/layout';
import { postCardFragment } from '@blog/service/shared/fragments/post';
import { sectionHeaderFragment } from '@blog/service/shared/fragments/section-header';
import {
  SHOW_IMAGES_EXPRESSION,
  showImagesParser,
} from '@blog/service/shared/fragments/show-images';

const newestFeaturedPostsQuery = q.star
  .filterByType('page_post')
  .filterRaw('featured == true')
  .filterRaw(PUBLISHED_POST_FILTER)
  .filterRaw(POST_CONTENT_READY_FILTER)
  .order('publishedAt desc')
  .slice(0, 3)
  .project(postCardFragment);

export const postFeaturedModuleQuery = q
  .parameters<{ id: string }>()
  .star.filterByType('module_postFeatured')
  .filterRaw('_id == $id')
  .slice(0)
  .project((sub) => ({
    brandVariant: sub.field('brandVariant').notNull(),
    sectionHeader: sub
      .field('sectionHeader')
      .project(sectionHeaderFragment)
      .nullable(true),
    postSource: sub.field('postSource').notNull(),
    posts: sub
      .select(
        {
          [`postSource == "${POST_SOURCE.PINNED}"`]: sub
            .field('posts[]')
            .deref()
            .filterRaw(PUBLISHED_POST_FILTER)
            .filterRaw(POST_CONTENT_READY_FILTER)
            .project(postCardFragment)
            .nullable(true),
        },
        newestFeaturedPostsQuery,
      )
      .nullable(true),
    limit: sub.field('limit').nullable(true),
    layout: sub.field('layout').project(layoutFragment).nullable(true),
    contentAlignment: sub.field('contentAlignment').nullable(true),
    showImages: sub.raw(SHOW_IMAGES_EXPRESSION, showImagesParser),
  }))
  .notNull();
