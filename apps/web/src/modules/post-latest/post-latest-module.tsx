import { service } from '@blog/service';
import { getTenantSanityContext } from '@web/server/tenant/get-tenant-sanity-context';
import { toPostListItems } from '@web/utils/to-post-list-items';
import { getTranslations } from 'next-intl/server';

import { PostListModuleView } from '../post-list/post-list-module-view';

export interface IPostLatestModuleProps {
  id: string;
  locale: string;
}

/**
 * PostLatestModule — fetches `module_postLatest` data (a latest-N teaser,
 * never paginated) and hands it to the shared `PostListModuleView`.
 */
export const PostLatestModule = async ({ id }: IPostLatestModuleProps) => {
  const tenant = await getTenantSanityContext();
  const [result, t] = await Promise.all([
    service.modules.postLatest.v1.getPostLatest(id, tenant),
    getTranslations('postLatestModule'),
  ]);

  if (!result.ok) return null;

  const { brandVariant, sectionHeader, posts, layout } = result.data;

  const items = await toPostListItems(posts);

  if (items.length === 0) return null;

  return (
    <PostListModuleView
      brandVariant={brandVariant}
      sectionHeader={sectionHeader}
      items={items}
      layout={layout}
      titleId={`latest-posts-${id}`}
      dataTestId={`post-latest-module-${id}`}
      accessibleTitle={t('fallbackHeading')}
    />
  );
};
