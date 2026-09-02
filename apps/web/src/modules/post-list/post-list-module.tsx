import { routes } from '@blog/config';
import { service } from '@blog/service';
import { getTenantSanityContext } from '@web/server/tenant/get-tenant-sanity-context';
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
  /** Pagination href builder. Defaults to `routes.blogIndex` for `/blog`; archive callers other than `/blog` must supply their own. */
  createHref?: (page: number) => string;
  /** Pagination nav `aria-label`. Defaults to the blog archive's own copy. */
  ariaLabel?: string;
  /** Fallback heading for screen readers when the CMS `sectionHeader.heading` is blank. Defaults to the blog archive's own copy. */
  accessibleTitle?: string;
  /** Empty-state copy for this archive. Defaults to the blog archive's own copy. */
  emptyMessageFallback?: string;
  titleId?: string;
}

/**
 * PostListModule — an archive's post list: fetches the `postList` slot's
 * `module_postList` document for the given page and hands it to
 * `PostListModuleView`. Reused by both `/blog` (no overrides — its own
 * copy/href are the defaults) and `/topics/{slug}` (which supplies its own
 * `createHref`/`ariaLabel`/`accessibleTitle`/`emptyMessageFallback`). Unlike
 * every other module, it always renders — an archive must say something even
 * with zero posts — and 404s (after logging) both when the fetch fails and
 * when an explicit page number exceeds the corpus's page count, since either
 * would otherwise render the page's primary content as silently missing.
 */
export const PostListModule = async ({
  id,
  page,
  createHref = routes.blogIndex,
  ariaLabel,
  accessibleTitle,
  emptyMessageFallback,
  titleId = 'blog-posts-title',
}: IPostListModuleProps) => {
  const tenant = await getTenantSanityContext();
  const [result, blogListT, paginationT] = await Promise.all([
    service.modules.postList.v1.getPostList(id, tenant, page),
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
    createHref,
    ariaLabel: ariaLabel ?? blogListT('paginationAriaLabel'),
    previousLabel: paginationT('previous'),
    nextLabel: paginationT('next'),
  };

  return (
    <PostListModuleView
      brandVariant={brandVariant}
      sectionHeader={sectionHeader}
      items={items}
      layout={layout}
      titleId={titleId}
      dataTestId={`post-list-module-${id}`}
      accessibleTitle={accessibleTitle ?? blogListT('title')}
      emptyMessage={emptyMessageFallback ?? blogListT('empty')}
      pagination={pagination}
    />
  );
};
