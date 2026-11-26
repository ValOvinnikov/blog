import { service, type TPostCard } from '@shinefold/service';
import { hasLength } from '@shinefold/utils/primitives';
import { POST_FEATURED_LOG } from '@web/constants/post-featured';
import { getPostCardsViewProps } from '@web/server/post-cards/get-post-cards-view-props/get-post-cards-view-props';
import { getRequestContext } from '@web/server/request-context/request-context';
import { logger } from '@web/utils/logger/logger';
import { renderPostCardImage } from '@web/utils/render-post-card-image';
import { renderPostLeadImage } from '@web/utils/render-post-lead-image';

import { PostFeaturedModuleView } from './post-featured-module-view';

export interface IPostFeaturedModuleProps {
  id: string;
}

export const PostFeaturedModule = async ({ id }: IPostFeaturedModuleProps) => {
  const { sanityContext, tenantId } = await getRequestContext();
  const result = await service.modules.postFeatured.v1.getPostFeatured(
    id,
    sanityContext,
  );

  if (!result.ok) {
    logger.error(POST_FEATURED_LOG.MODULE_FETCH_FAILED, {
      id,
      error: result.error,
    });
    return null;
  }

  const { posts, showImages, displayMode } = result.data;
  const leadPostId = posts[0]?.id;
  const renderImage = (post: TPostCard) =>
    post.id === leadPostId
      ? renderPostLeadImage(post)
      : renderPostCardImage(post);

  const viewProps = await getPostCardsViewProps(
    tenantId,
    result.data,
    {
      titleId: `featured-posts-${id}`,
      dataTestId: `post-featured-module-${id}`,
    },
    renderImage,
  );

  if (!hasLength(viewProps.items)) return null;

  return (
    <PostFeaturedModuleView
      {...viewProps}
      hasImages={showImages}
      displayMode={displayMode}
    />
  );
};
