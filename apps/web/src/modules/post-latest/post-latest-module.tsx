import { service } from '@shinefold/service';
import { hasLength } from '@shinefold/utils/primitives';
import { POST_LATEST_LOG } from '@web/constants/post-latest';
import { getPostCardsViewProps } from '@web/server/post-cards/get-post-cards-view-props/get-post-cards-view-props';
import { getRequestContext } from '@web/server/request-context/request-context';
import { logger } from '@web/utils/logger/logger';

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

  const { showImages, displayMode, columns } = result.data;
  const viewProps = await getPostCardsViewProps(tenantId, result.data, {
    titleId: `latest-posts-${id}`,
    dataTestId: `post-latest-module-${id}`,
  });

  if (!hasLength(viewProps.items)) return null;

  return (
    <PostLatestModuleView
      {...viewProps}
      columns={columns}
      hasImages={showImages}
      displayMode={displayMode}
    />
  );
};
