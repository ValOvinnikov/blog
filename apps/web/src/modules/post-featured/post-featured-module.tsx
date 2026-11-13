import { service, type TPostCard } from '@blog/service';
import { hasLength } from '@blog/utils/primitives';
import { POST_FEATURED_LOG } from '@web/constants/post-featured';
import { getPostCardsSection } from '@web/server/post-cards/get-post-cards-section/get-post-cards-section';
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

  const {
    brandVariant,
    headingBlock,
    posts,
    layout,
    contentAlignment,
    showImages,
    displayMode,
  } = result.data;

  const leadPostId = posts[0]?.id;
  const renderImage = (post: TPostCard) =>
    post.id === leadPostId
      ? renderPostLeadImage(post)
      : renderPostCardImage(post);

  const { items, appearance } = await getPostCardsSection(
    tenantId,
    result.data,
    renderImage,
  );

  if (!hasLength(items)) return null;

  return (
    <PostFeaturedModuleView
      section={{ brandVariant, layout, appearance }}
      headingBlock={headingBlock}
      items={items}
      contentAlignment={contentAlignment}
      hasImages={showImages}
      displayMode={displayMode}
      titleId={`featured-posts-${id}`}
      dataTestId={`post-featured-module-${id}`}
    />
  );
};
