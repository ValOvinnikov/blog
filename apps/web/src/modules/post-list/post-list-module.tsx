import { routes, TAXONOMY_KIND, type TTaxonomyKind } from '@blog/config';
import { service } from '@blog/service';
import { VoiceRichText } from '@web/components/shared/voice-rich-text';
import type { TModuleComponentProps } from '@web/modules/module-renderer';
import { getRequestContext } from '@web/server/request-context/request-context';
import { getVoiceRich } from '@web/server/site-config/get-voice-rich/get-voice-rich';
import { fillVoicePlaceholders } from '@web/utils/fill-voice-placeholders';
import { logger } from '@web/utils/logger/logger';
import { renderPostCardImage } from '@web/utils/render-post-card-image';
import type { TVoiceRichFieldId } from '@web/utils/resolve-voice-rich-fields';
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

const ARCHIVE_EMPTY_FIELD: Record<TTaxonomyKind, TVoiceRichFieldId> = {
  [TAXONOMY_KIND.TOPICS]: 'topicEmpty',
  [TAXONOMY_KIND.TAGS]: 'tagEmpty',
};

const ARCHIVE_TITLE_ID: Record<TTaxonomyKind, string> = {
  [TAXONOMY_KIND.TOPICS]: 'topic-posts-title',
  [TAXONOMY_KIND.TAGS]: 'tag-posts-title',
};

export const PostListModule = async ({ id, context }: TPostListModuleProps) => {
  const resolvedPage = context?.page ?? 1;
  const archive = context?.archive;

  const { sanityContext } = await getRequestContext();
  const [result, paginationT, scopedT, emptyRich] = await Promise.all([
    service.modules.postList.v1.getPostList(
      id,
      sanityContext,
      resolvedPage,
      archive && { termId: archive.id },
    ),
    getTranslations('pagination'),
    getTranslations(archive ? ARCHIVE_NAMESPACE[archive.kind] : 'blogListPage'),
    getVoiceRich(archive ? ARCHIVE_EMPTY_FIELD[archive.kind] : 'blogListEmpty'),
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
      emptyMessage={
        <VoiceRichText
          value={fillVoicePlaceholders(emptyRich, scopedParams ?? {})}
        />
      }
      pagination={pagination}
    />
  );
};
