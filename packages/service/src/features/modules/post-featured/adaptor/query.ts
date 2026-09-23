import { POST_SOURCE } from '@blog/config';
import { q, type TModuleQueryParams } from '@blog/service/sanity/query';
import {
  DISPLAY_MODE_EXPRESSION,
  displayModeParser,
} from '@blog/service/shared/expressions/display-mode';
import { PUBLISHED_POST_FILTER } from '@blog/service/shared/expressions/published-post';
import {
  SHOW_IMAGES_EXPRESSION,
  showImagesParser,
} from '@blog/service/shared/expressions/show-images';
import { headingBlockFragment } from '@blog/service/shared/fragments/heading-block/heading-block';
import { layoutFragment } from '@blog/service/shared/fragments/layout/layout';
import { postCardFragment } from '@blog/service/shared/fragments/post/post';

const newestFeaturedPostsQuery = q.star
  .filterByType('page_post')
  .filterRaw('featured == true')
  .filterRaw(PUBLISHED_POST_FILTER)
  .order('publishedAt desc')
  .slice(0, 3)
  .project(postCardFragment);

export const postFeaturedModuleQuery = q
  .parameters<TModuleQueryParams>()
  .star.filterByType('module_postFeatured')
  .filterBy('_id == $id')
  .slice(0)
  .project((sub) => ({
    brandVariant: sub.field('brandVariant').notNull(),
    headingBlock: sub
      .field('headingBlock')
      .project(headingBlockFragment)
      .notNull(),
    postSource: sub.field('postSource').notNull(),
    posts: sub
      .select(
        {
          [`postSource == "${POST_SOURCE.PINNED}"`]: sub
            .field('posts[]')
            .deref()
            .filterRaw(PUBLISHED_POST_FILTER)
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
    displayMode: sub.raw(DISPLAY_MODE_EXPRESSION, displayModeParser),
  }))
  .notNull();
