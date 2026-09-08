import { service } from '@blog/service';
import { getTenantSanityContext } from '@web/server/tenant/get-tenant-sanity-context';
import { renderPostCardImage } from '@web/utils/render-post-card-image';
import { toPostListItems } from '@web/utils/to-post-list-items';
import { getTranslations } from 'next-intl/server';

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
  const [result, t] = await Promise.all([
    service.modules.postLatest.v1.getPostLatest(id, tenantContext),
    getTranslations('postLatestModule'),
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

  const items = await toPostListItems(
    posts,
    showImages ? renderPostCardImage : undefined,
  );

  if (items.length === 0) return null;

  return (
    <PostLatestModuleView
      brandVariant={brandVariant}
      sectionHeader={sectionHeader}
      items={items}
      layout={layout}
      contentAlignment={contentAlignment}
      hasImages={showImages}
      titleId={`latest-posts-${id}`}
      dataTestId={`post-latest-module-${id}`}
      accessibleTitle={t('fallbackHeading')}
    />
  );
};
