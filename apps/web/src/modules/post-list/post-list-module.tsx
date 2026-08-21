import { routes } from '@blog/config';
import { service } from '@blog/service';
import { logger } from '@web/utils/logger/logger';
import { toPostListItems } from '@web/utils/to-post-list-items';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import {
  PostListModuleView,
  type IPostListModulePagination,
} from './post-list-module-view';

export interface IPostListModuleProps {
  id: string;
  locale: string;
  page: number;
}

/**
 * PostListModule — the `/blog` archive: fetches the `page_blog.postList`
 * slot's `module_postList` document for the given page and hands it to
 * `PostListModuleView`. Unlike every other module, it always renders — an
 * archive must say something even with zero posts — and 404s (after logging)
 * both when the fetch fails and when an explicit page number exceeds the
 * corpus's page count, since either would otherwise render the page's
 * primary content as silently missing.
 */
export const PostListModule = async ({ id, page }: IPostListModuleProps) => {
  const [result, blogListT, paginationT] = await Promise.all([
    service.modules.postList.v1.getPostList(id, page),
    getTranslations('blogListPage'),
    getTranslations('pagination'),
  ]);

  if (!result.ok) {
    logger.error('post_list_module.fetch_failed', {
      id,
      page,
      error: result.error,
    });
    notFound();
  }

  const {
    brandVariant,
    sectionHeader,
    posts,
    layout,
    emptyMessage,
    currentPage,
    totalPages,
  } = result.data;

  // Out-of-range page (corpus shrank or hand-typed URL) → hard 404, never a
  // soft-404 or a redirect to the last page (spec SEO rules). Page 1 of an
  // empty archive is `totalPages === 1`, so page 1 never 404s.
  if (page > totalPages) {
    notFound();
  }

  const items = await toPostListItems(posts);

  const pagination: IPostListModulePagination = {
    currentPage,
    totalPages,
    createHref: routes.blogIndex,
    ariaLabel: blogListT('paginationAriaLabel'),
    previousLabel: paginationT('previous'),
    nextLabel: paginationT('next'),
  };

  return (
    <PostListModuleView
      brandVariant={brandVariant}
      sectionHeader={sectionHeader}
      items={items}
      layout={layout}
      titleId="blog-posts-title"
      dataTestId={`post-list-module-${id}`}
      accessibleTitle={blogListT('title')}
      emptyMessage={emptyMessage ?? blogListT('empty')}
      pagination={pagination}
    />
  );
};
