import { service } from '@blog/service';
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
export async function PostLatestModule({ id }: IPostLatestModuleProps) {
  const [result, t] = await Promise.all([
    service.modules.postLatest.v1.getPostLatest(id),
    getTranslations('postLatestModule'),
  ]);

  if (!result.ok) return null;

  const { brandVariant, sectionHeader, posts, layout } = result.data;

  const items = await toPostListItems(posts);

  if (items.length === 0) return null;

  return (
    <PostListModuleView
      id={id}
      brandVariant={brandVariant}
      sectionHeader={sectionHeader}
      items={items}
      layout={layout}
      titleFallback={t('fallbackHeading')}
    />
  );
}
