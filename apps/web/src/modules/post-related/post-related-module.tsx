import { service } from '@blog/service';
import type { TModuleComponentProps } from '@web/modules/module-map';
import { getTenantSanityContext } from '@web/server/tenant/get-tenant-sanity-context';
import { logger } from '@web/utils/logger/logger';
import { renderPostCardImage } from '@web/utils/render-post-card-image';
import { toPostListItems } from '@web/utils/to-post-list-items';
import { getTranslations } from 'next-intl/server';

import { PostRelatedModuleView } from './post-related-module-view';

export type TPostRelatedModuleProps = TModuleComponentProps;

/**
 * PostRelatedModule — fetches `module_postRelated` data (posts related to
 * the `page_post` it sits on) and hands it to `PostRelatedModuleView`.
 * Renders nothing when the renderer didn't supply the anchor post via
 * `context.post` — this module only ever sits on a post page's `modules[]`.
 */
export const PostRelatedModule = async ({
  id,
  tenant,
  context,
}: TPostRelatedModuleProps) => {
  const postId = context?.post?.id;
  if (!postId) {
    logger.warn('post_related_module.missing_post_context', { id });
    return null;
  }

  const tenantContext = await getTenantSanityContext(tenant);
  const [result, t] = await Promise.all([
    service.modules.postRelated.v1.getPostRelated(id, postId, tenantContext),
    getTranslations('postRelatedModule'),
  ]);

  if (!result.ok) return null;

  const {
    brandVariant,
    headingBlock,
    posts,
    layout,
    contentAlignment,
    showImages,
  } = result.data;

  const items = await toPostListItems(
    posts,
    showImages ? renderPostCardImage : undefined,
  );

  if (items.length === 0) return null;

  return (
    <PostRelatedModuleView
      brandVariant={brandVariant}
      headingBlock={headingBlock}
      items={items}
      layout={layout}
      contentAlignment={contentAlignment}
      hasImages={showImages}
      titleId={`related-posts-${id}`}
      dataTestId={`post-related-module-${id}`}
      accessibleTitle={t('fallbackHeading')}
    />
  );
};
