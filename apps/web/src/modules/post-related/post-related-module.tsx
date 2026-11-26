import { service } from '@shinefold/service';
import { hasLength } from '@shinefold/utils/primitives';
import { POST_RELATED_LOG } from '@web/constants/post-related';
import type { TModuleComponentProps } from '@web/modules/module-renderer';
import { getPostCardsViewProps } from '@web/server/post-cards/get-post-cards-view-props/get-post-cards-view-props';
import { getRequestContext } from '@web/server/request-context/request-context';
import { logger } from '@web/utils/logger/logger';

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

  const { showImages, displayMode, columns } = result.data;
  const viewProps = await getPostCardsViewProps(tenantId, result.data, {
    titleId: `related-posts-${id}`,
    dataTestId: `post-related-module-${id}`,
  });

  if (!hasLength(viewProps.items)) return null;

  return (
    <PostRelatedModuleView
      {...viewProps}
      columns={columns}
      hasImages={showImages}
      displayMode={displayMode}
    />
  );
};
