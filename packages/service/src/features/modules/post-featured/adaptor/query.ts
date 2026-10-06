import { POST_SOURCE } from '@blog/config';
import { q, type TModuleQueryParams } from '@blog/service/sanity/query/query';
import {
  DISPLAY_MODE_EXPRESSION,
  displayModeParser,
} from '@blog/service/shared/expressions/module/display-mode';
import {
  SHOW_IMAGES_EXPRESSION,
  showImagesParser,
} from '@blog/service/shared/expressions/module/show-images';
import { POST_IN_LOCALE_FILTER } from '@blog/service/shared/expressions/post/post-in-locale';
import { PUBLISHED_POST_FILTER } from '@blog/service/shared/expressions/post/published-post';
import { moduleHeadingBlockFragment } from '@blog/service/shared/fragments/heading-block/module-heading-block';
import { moduleWideLayoutFragment } from '@blog/service/shared/fragments/layout/layout';
import { moduleContentAlignmentLeftCenterFragment } from '@blog/service/shared/fragments/module/module-content-alignment';
import { pinnedPostInLocale } from '@blog/service/shared/fragments/post/pinned-post';
import { postCardFragment } from '@blog/service/shared/fragments/post/post';

const newestFeaturedPostsQuery = q.star
  .filterByType('page_post')
  .filterRaw('featured == true')
  .filterRaw(POST_IN_LOCALE_FILTER)
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
      .project(moduleHeadingBlockFragment)
      .notNull(),
    postSource: sub.field('postSource').notNull(),
    posts: sub
      .select(
        {
          [`postSource == "${POST_SOURCE.PINNED}"`]: sub
            .field('posts[]')
            .project((ref) => ({
              post: pinnedPostInLocale(ref, ref.field('@'), {
                publishedOnly: true,
              }).nullable(true),
            }))
            .nullable(true),
        },
        newestFeaturedPostsQuery,
      )
      .nullable(true),
    limit: sub.field('limit').nullable(true),
    ...moduleWideLayoutFragment,
    ...moduleContentAlignmentLeftCenterFragment,
    showImages: sub.raw(SHOW_IMAGES_EXPRESSION, showImagesParser),
    displayMode: sub.raw(DISPLAY_MODE_EXPRESSION, displayModeParser),
  }))
  .notNull();
