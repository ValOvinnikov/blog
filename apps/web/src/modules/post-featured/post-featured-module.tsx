import { service, type TPostCard } from '@blog/service';
import { getTenantSanityContext } from '@web/server/tenant/get-tenant-sanity-context';
import { renderPostCardImage } from '@web/utils/render-post-card-image';
import { renderPostLeadImage } from '@web/utils/render-post-lead-image';
import { toPostListItems } from '@web/utils/to-post-list-items';
import { getTranslations } from 'next-intl/server';

import { PostListModuleView } from '../post-list/post-list-module-view';

export interface IPostFeaturedModuleProps {
  id: string;
  locale: string;
  tenant: string;
}

/**
 * PostFeaturedModule — fetches `module_postFeatured` data (one to three
 * editor-pinned posts) and hands it to the shared `PostListModuleView` with
 * the first post rendered as a full-width lead card.
 */
export const PostFeaturedModule = async ({
  id,
  tenant,
}: IPostFeaturedModuleProps) => {
  const tenantContext = await getTenantSanityContext(tenant);
  const [result, t] = await Promise.all([
    service.modules.postFeatured.v1.getPostFeatured(id, tenantContext),
    getTranslations('postFeaturedModule'),
  ]);

  if (!result.ok) return null;

  const {
    brandVariant,
    sectionHeader,
    posts,
    layout,
    contentAlignment,
    showImages,
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

  if (items.length === 0) return null;

  return (
    <PostListModuleView
      brandVariant={brandVariant}
      sectionHeader={sectionHeader}
      items={items}
      layout={layout}
      contentAlignment={contentAlignment}
      hasImages={showImages}
      hasLead={true}
      titleId={`featured-posts-${id}`}
      dataTestId={`post-featured-module-${id}`}
      accessibleTitle={t('fallbackHeading')}
    />
  );
};
