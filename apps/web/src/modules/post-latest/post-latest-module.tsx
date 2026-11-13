import { service } from '@blog/service';
import { hasLength } from '@blog/utils/primitives';
import { POST_LATEST_LOG } from '@web/constants/post-latest';
import { getPostCardsSection } from '@web/server/post-cards/get-post-cards-section/get-post-cards-section';
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

  const {
    brandVariant,
    headingBlock,
    layout,
    contentAlignment,
    showImages,
    displayMode,
    columns,
  } = result.data;

  const { items, appearance } = await getPostCardsSection(
    tenantId,
    result.data,
  );

  if (!hasLength(items)) return null;

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
