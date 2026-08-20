import { service } from '@blog/service';
import { toPostListItems } from '@web/utils/to-post-list-items';

import { PostListModuleView } from './post-list-module-view';

export interface IPostListModuleProps {
  id: string;
  locale: string;
}

/**
 * PostListModule — fetches `module_postList` data and hands it to
 * `PostListModuleView`.
 */
export async function PostListModule({ id }: IPostListModuleProps) {
  const result = await service.modules.postList.v1.getPostList(id);

  if (!result.ok) return null;

  const { brandVariant, sectionHeader, posts, layout } = result.data;

  const items = await toPostListItems(posts);

  // No posts resolved (e.g. the referenced/latest posts are unpublished or
  // filtered to zero) — `PostsSection` renders nothing without an
  // `emptyMessage`, so skip the view entirely rather than emit an empty
  // landmark whose `aria-labelledby` points at a heading id that never
  // renders.
  if (items.length === 0) return null;

  return (
    <PostListModuleView
      id={id}
      brandVariant={brandVariant}
      sectionHeader={sectionHeader}
      items={items}
      layout={layout}
    />
  );
}
