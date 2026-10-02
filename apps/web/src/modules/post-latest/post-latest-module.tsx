import { service } from '@blog/service';
import { getRequestContext } from '@web/server/request-context/request-context';
import { logger } from '@web/utils/logger/logger';
import { renderPostCardImage } from '@web/utils/render-post-card-image';
import { toPostListItems } from '@web/utils/to-post-list-items';

import { PostLatestModuleView } from './post-latest-module-view';

export interface IPostLatestModuleProps {
  id: string;
}

export const PostLatestModule = async ({ id }: IPostLatestModuleProps) => {
  const { sanityContext } = await getRequestContext();
  const result = await service.modules.postLatest.v1.getPostLatest(
    id,
    sanityContext,
  );

  if (!result.ok) {
    logger.error('post_latest_module.fetch_failed', {
      id,
      error: result.error,
    });
    return null;
  }

  const {
    brandVariant,
    headingBlock,
    posts,
    layout,
    contentAlignment,
    showImages,
    displayMode,
  } = result.data;

  const items = await toPostListItems(
    posts,
    showImages ? renderPostCardImage : undefined,
  );

  if (items.length === 0) return null;

  return (
    <PostLatestModuleView
      brandVariant={brandVariant}
      headingBlock={headingBlock}
      items={items}
      layout={layout}
      contentAlignment={contentAlignment}
      hasImages={showImages}
      displayMode={displayMode}
      titleId={`latest-posts-${id}`}
      dataTestId={`post-latest-module-${id}`}
    />
  );
};
