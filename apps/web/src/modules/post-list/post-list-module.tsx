import type { TModulePageContext, TModulePageContextType } from '@blog/config';
import { service } from '@blog/service';
import { toTotalPages } from '@blog/utils';
import { toPostListItems } from '@web/utils/to-post-list-items';
import { toPostListPaginationHref } from '@web/utils/to-post-list-pagination-href';
import { getTranslations } from 'next-intl/server';

import {
  PostListModuleView,
  type IPostListModulePagination,
} from './post-list-module-view';

export interface IPostListModuleProps {
  id: string;
  locale: string;
  context?: TModulePageContext;
}

const PAGE_TYPE_LABEL: Record<TModulePageContextType, string> = {
  HOME: 'Home',
  BLOG: 'Blog',
  GENERIC: 'Generic',
  TOPIC: 'Topic',
  TAG: 'Tag',
};

/**
 * PostListModule — fetches `module_postList` data, scoped/paginated by
 * `context`, and hands it to `PostListModuleView`. Every other module in
 * `MODULE_MAP` ignores `context`; this is the only consumer.
 */
export async function PostListModule({ id, context }: IPostListModuleProps) {
  const [result, t, paginationT] = await Promise.all([
    service.modules.postList.v1.getPostList(id, context),
    getTranslations('postListModule'),
    getTranslations('pagination'),
  ]);

  if (!result.ok) return null;

  const { brandVariant, sectionHeader, posts, layout, total } = result.data;

  const items = await toPostListItems(posts);

  // No posts resolved (e.g. the referenced/latest posts are unpublished or
  // filtered to zero) — `PostsSection` renders nothing without an
  // `emptyMessage`, so skip the view entirely rather than emit a landmark
  // whose `aria-labelledby` points at a heading id that never renders.
  if (items.length === 0) return null;

  let pagination: IPostListModulePagination | undefined;

  if (context?.isPaginated) {
    pagination = {
      currentPage: context.page,
      totalPages: toTotalPages(total ?? 0, context.pageSize),
      createHref: toPostListPaginationHref(context),
      ariaLabel: paginationT('ariaLabel', {
        pageType: PAGE_TYPE_LABEL[context.type],
      }),
      previousLabel: paginationT('previous'),
      nextLabel: paginationT('next'),
    };
  }

  return (
    <PostListModuleView
      id={id}
      brandVariant={brandVariant}
      sectionHeader={sectionHeader}
      items={items}
      layout={layout}
      titleFallback={t('fallbackHeading')}
      pagination={pagination}
    />
  );
}
