import { service } from '@blog/service';
import { getTenantSanityContext } from '@web/server/tenant/get-tenant-sanity-context';
import { renderPostCardImage } from '@web/utils/render-post-card-image';
import { toPostListItems } from '@web/utils/to-post-list-items';

import { PostLatestModuleView } from './post-latest-module-view';

export interface IPostLatestModuleProps {
  id: string;
  locale: string;
  tenant: string;
}

/**
 * PostLatestModule — fetches `module_postLatest` data (a latest-N teaser,
 * never paginated) and hands it to `PostLatestModuleView`.
 */
export const PostLatestModule = async ({
  id,
  tenant,
}: IPostLatestModuleProps) => {
  const tenantContext = await getTenantSanityContext(tenant);
  const result = await service.modules.postLatest.v1.getPostLatest(
    id,
    tenantContext,
  );

  if (!result.ok) return null;

  const {
    brandVariant,
    headingBlock,
    posts,
    layout,
    contentAlignment,
    showImages,
    displayMode,
  } = result.data;

  const items = await toPostListItems(
    posts,
    showImages ? renderPostCardImage : undefined,
  );

  if (items.length === 0) return null;

  return (
    <PostLatestModuleView
      brandVariant={brandVariant}
      headingBlock={headingBlock}
      items={items}
      layout={layout}
      contentAlignment={contentAlignment}
      hasImages={showImages}
      displayMode={displayMode}
      titleId={`latest-posts-${id}`}
      dataTestId={`post-latest-module-${id}`}
    />
  );
};
