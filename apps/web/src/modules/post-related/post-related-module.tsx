import { service } from '@blog/service';
import { hasLength } from '@blog/utils/primitives';
import { POST_RELATED_LOG } from '@web/constants/post-related';
import type { TModuleComponentProps } from '@web/modules/module-renderer';
import { getPostCardsSection } from '@web/server/post-cards/get-post-cards-section/get-post-cards-section';
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
