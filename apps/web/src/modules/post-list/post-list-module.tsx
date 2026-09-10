import { routes, TAXONOMY_KIND, type TTaxonomyKind } from '@blog/config';
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

export type TPostListModuleProps = TModuleComponentProps;

const ARCHIVE_ROUTE_BUILDER: Record<
  TTaxonomyKind,
  (slug: string, page?: number) => string
> = {
  [TAXONOMY_KIND.TOPICS]: routes.topic,
  [TAXONOMY_KIND.TAGS]: routes.tag,
};

const ARCHIVE_NAMESPACE: Record<TTaxonomyKind, string> = {
  [TAXONOMY_KIND.TOPICS]: 'topicPage',
  [TAXONOMY_KIND.TAGS]: 'tagPage',
};

const ARCHIVE_TITLE_ID: Record<TTaxonomyKind, string> = {
  [TAXONOMY_KIND.TOPICS]: 'topic-posts-title',
  [TAXONOMY_KIND.TAGS]: 'tag-posts-title',
};

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
  context,
}: TPostListModuleProps) => {
  const resolvedPage = context?.page ?? 1;
  const archive = context?.archive;

  const tenantContext = await getTenantSanityContext(tenant);
  const [result, paginationT, scopedT] = await Promise.all([
    service.modules.postList.v1.getPostList(
      id,
      tenantContext,
      resolvedPage,
      archive && { kind: archive.kind, slug: archive.slug },
    ),
    getTranslations('pagination'),
    getTranslations(archive ? ARCHIVE_NAMESPACE[archive.kind] : 'blogListPage'),
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

  const scopedParams = archive ? { name: archive.name } : undefined;
  const createHref = archive
    ? (pageNumber: number) =>
        ARCHIVE_ROUTE_BUILDER[archive.kind](archive.slug, pageNumber)
    : routes.blogIndex;
  const titleId = archive ? ARCHIVE_TITLE_ID[archive.kind] : 'blog-posts-title';

  const pagination: IPostListModulePagination = {
    currentPage,
    totalPages,
    createHref,
    ariaLabel: scopedT('paginationAriaLabel', scopedParams),
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
      accessibleTitle={scopedT('title', scopedParams)}
      emptyMessage={scopedT('empty', scopedParams)}
      pagination={pagination}
    />
  );
};
