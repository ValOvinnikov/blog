import { POST_SOURCE } from '@shinefold/config';
import {
  q,
  type TModuleQueryParams,
} from '@shinefold/service/sanity/query/query';
import {
  DISPLAY_MODE_EXPRESSION,
  displayModeParser,
} from '@shinefold/service/shared/expressions/module/display-mode';
import {
  SHOW_IMAGES_EXPRESSION,
  showImagesParser,
} from '@shinefold/service/shared/expressions/module/show-images';
import { FEATURED_POST_FILTER } from '@shinefold/service/shared/expressions/post/featured-post';
import { moduleHeadingBlockFragment } from '@shinefold/service/shared/fragments/heading-block/module-heading-block';
import { moduleWideLayoutFragment } from '@shinefold/service/shared/fragments/layout/layout';
import { moduleAppearanceFragment } from '@shinefold/service/shared/fragments/module/module-appearance';
import { moduleContentAlignmentLeftCenterFragment } from '@shinefold/service/shared/fragments/module/module-content-alignment';
import { postCardFragment } from '@shinefold/service/shared/fragments/post/post';
import type { TLocaleQueryParams } from '@shinefold/service/shared/localization/locale-query-params/locale-query-params';
import { pinnedPostInLocale } from '@shinefold/service/shared/localization/pinned-post-in-locale/pinned-post-in-locale';
import { publishedPostsInLocale } from '@shinefold/service/shared/localization/published-posts-in-locale/published-posts-in-locale';

const newestFeaturedPostsQuery = publishedPostsInLocale(
  q.parameters<TLocaleQueryParams>().star,
)
  .filterRaw(FEATURED_POST_FILTER)
  .order('publishedAt desc')
  .slice(0, 3)
  .project((post) => ({
    post: post.field('@').project(postCardFragment),
  }));

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
    ...moduleAppearanceFragment,
    showImages: sub.raw(SHOW_IMAGES_EXPRESSION, showImagesParser),
    displayMode: sub.raw(DISPLAY_MODE_EXPRESSION, displayModeParser),
  }))
  .notNull();
