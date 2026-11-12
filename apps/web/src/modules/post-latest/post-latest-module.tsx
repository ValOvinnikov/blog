import { service } from '@blog/service';
import { hasLength } from '@blog/utils/primitives';
import { POST_LATEST_LOG } from '@web/constants/post-latest';
import { getRequestContext } from '@web/server/request-context/request-context';
import { getSectionAppearance } from '@web/server/site-config/get-section-appearance/get-section-appearance';
import { logger } from '@web/utils/logger/logger';
import { renderPostCardImage } from '@web/utils/render-post-card-image';
import { toPostListItems } from '@web/utils/to-post-list-items';

import { PostLatestModuleView } from './post-latest-module-view';

export interface IPostLatestModuleProps {
  id: string;
}

export const PostLatestModule = async ({ id }: IPostLatestModuleProps) => {
  const { sanityContext, tenantId } = await getRequestContext();
  const result = await service.modules.postLatest.v1.getPostLatest(
    id,
    sanityContext,
  );

  if (!result.ok) {
    logger.error(POST_LATEST_LOG.MODULE_FETCH_FAILED, {
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
    cardStyle,
    radiusScale,
    density,
    columns,
  } = result.data;

  const items = await toPostListItems(
    posts,
    showImages ? renderPostCardImage : undefined,
  );

  if (!hasLength(items)) return null;

  const appearance = await getSectionAppearance(tenantId, {
    cardStyle,
    radiusScale,
    density,
  });

  return (
    <PostLatestModuleView
      section={{ brandVariant, layout, appearance }}
      headingBlock={headingBlock}
      items={items}
      columns={columns}
      contentAlignment={contentAlignment}
      hasImages={showImages}
      displayMode={displayMode}
      titleId={`latest-posts-${id}`}
      dataTestId={`post-latest-module-${id}`}
    />
  );
};
