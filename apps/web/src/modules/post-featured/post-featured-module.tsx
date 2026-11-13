import { service, type TPostCard } from '@blog/service';
import { hasLength } from '@blog/utils/primitives';
import { POST_FEATURED_LOG } from '@web/constants/post-featured';
import { getRequestContext } from '@web/server/request-context/request-context';
import { getSectionAppearance } from '@web/server/site-config/get-section-appearance/get-section-appearance';
import { logger } from '@web/utils/logger/logger';
import { renderPostCardImage } from '@web/utils/render-post-card-image';
import { renderPostLeadImage } from '@web/utils/render-post-lead-image';
import { toPostListItems } from '@web/utils/to-post-list-items';

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
    cardStyle,
    radiusScale,
    density,
  } = result.data;

  const leadPostId = posts[0]?.id;
  const renderImage = (post: TPostCard) =>
    post.id === leadPostId
      ? renderPostLeadImage(post)
      : renderPostCardImage(post);

  const items = await toPostListItems(
    posts,
    showImages ? renderImage : undefined,
  );

  if (!hasLength(items)) return null;

  const appearance = await getSectionAppearance(tenantId, {
    cardStyle,
    radiusScale,
    density,
  });

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
