import { routes } from '@blog/config';
import { service } from '@blog/service';
import type { TModuleComponentProps } from '@web/modules/module-map';
import { getTenantSanityContext } from '@web/server/tenant/get-tenant-sanity-context';
import { logger } from '@web/utils/logger/logger';
import { renderPostCardImage } from '@web/utils/render-post-card-image';
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
  tenant: string;
  /** Falls back to `1` when omitted. Superseded by `context.page` when both are given, so a shared `ModuleRenderer` context can carry the current page instead. */
  page?: number;
  context?: TModuleComponentProps['context'];
  /** Pagination href builder. Defaults to `routes.blogIndex` for `/blog`; archive callers other than `/blog` must supply their own. */
  createHref?: (page: number) => string;
  /** Pagination nav `aria-label`. Defaults to the blog archive's own copy. */
  ariaLabel?: string;
  /** Fallback heading for screen readers when the CMS `headingBlock.heading` is blank. Defaults to the blog archive's own copy. */
  accessibleTitle?: string;
  /** Empty-state copy for this archive. Defaults to the blog archive's own copy. */
  emptyMessageFallback?: string;
  titleId?: string;
}

/**
 * PostListModule — an archive's post list: fetches a `module_postList`
 * document for the given page and hands it to `PostListModuleView`. Unlike
 * every other module, it always renders — an archive must say something even
 * with zero posts — and 404s (after logging) both when the fetch fails and
 * when an explicit page number exceeds the corpus's page count, since either
 * would otherwise render the page's primary content as silently missing.
 */
export const PostListModule = async ({
  id,
  tenant,
  page = 1,
  context,
  createHref = routes.blogIndex,
  ariaLabel,
  accessibleTitle,
  emptyMessageFallback,
  titleId = 'blog-posts-title',
}: IPostListModuleProps) => {
  const resolvedPage = context?.page ?? page;
  const tenantContext = await getTenantSanityContext(tenant);
  const [result, blogListT, paginationT] = await Promise.all([
    service.modules.postList.v1.getPostList(id, tenantContext, resolvedPage),
    getTranslations('blogListPage'),
    getTranslations('pagination'),
  ]);

  if (!result.ok) {
    logger.error('post_list_module.fetch_failed', {
      id,
      page: resolvedPage,
      error: result.error,
    });
    notFound();
  }

  const {
    brandVariant,
    headingBlock,
    posts,
    layout,
    currentPage,
    totalPages,
    contentAlignment,
    showImages,
  } = result.data;

  // Out-of-range page (corpus shrank or hand-typed URL) → hard 404, never a
  // soft-404 or a redirect to the last page (spec SEO rules). Page 1 of an
  // empty archive is `totalPages === 1`, so page 1 never 404s.
  if (resolvedPage > totalPages) {
    notFound();
  }

  const items = await toPostListItems(
    posts,
    showImages ? renderPostCardImage : undefined,
  );

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
      headingBlock={headingBlock}
      items={items}
      layout={layout}
      contentAlignment={contentAlignment}
      hasImages={showImages}
      titleId={titleId}
      dataTestId={`post-list-module-${id}`}
      accessibleTitle={accessibleTitle ?? blogListT('title')}
      emptyMessage={emptyMessageFallback ?? blogListT('empty')}
      pagination={pagination}
    />
  );
};
