import { service } from '@blog/service';
import { hasLength } from '@blog/utils/primitives';
import { POST_RELATED_LOG } from '@web/constants/post-related';
import type { TModuleComponentProps } from '@web/modules/module-renderer';
import { getRequestContext } from '@web/server/request-context/request-context';
import { getSectionAppearance } from '@web/server/site-config/get-section-appearance/get-section-appearance';
import { logger } from '@web/utils/logger/logger';
import { renderPostCardImage } from '@web/utils/render-post-card-image';
import { toPostListItems } from '@web/utils/to-post-list-items';

import { PostRelatedModuleView } from './post-related-module-view';

export type TPostRelatedModuleProps = TModuleComponentProps;

export const PostRelatedModule = async ({
  id,
  context,
}: TPostRelatedModuleProps) => {
  const postId = context?.post?.id;
  if (!postId) {
    logger.warn(POST_RELATED_LOG.MISSING_POST_CONTEXT, { id });
    return null;
  }

  const { sanityContext, tenantId } = await getRequestContext();
  const result = await service.modules.postRelated.v1.getPostRelated(
    id,
    postId,
    sanityContext,
  );

  if (!result.ok) {
    logger.error(POST_RELATED_LOG.MODULE_FETCH_FAILED, {
      id,
      postId,
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
    <PostRelatedModuleView
      section={{ brandVariant, layout, appearance }}
      headingBlock={headingBlock}
      items={items}
      columns={columns}
      contentAlignment={contentAlignment}
      hasImages={showImages}
      displayMode={displayMode}
      titleId={`related-posts-${id}`}
      dataTestId={`post-related-module-${id}`}
    />
  );
};
