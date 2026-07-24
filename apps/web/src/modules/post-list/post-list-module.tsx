import { service } from '@blog/service';
import { PostsSection } from '@blog/ui/organisms';
import { Link } from '@web/i18n/navigation';
import { toPostListItems } from '@web/utils/to-post-list-items';

export interface IPostListModuleProps {
  id: string;
  locale: string;
}

/**
 * PostListModule — fetches `module_postList` data and renders it through the
 * `PostsSection` organism. The only place this module's service and ui meet.
 */
export async function PostListModule({ id }: IPostListModuleProps) {
  const result = await service.modules.postList.v1.getPostList(id);

  if (!result.ok) return null;

  const { title, posts } = result.data;

  const items = await toPostListItems(posts);

  return (
    <PostsSection
      posts={items}
      title={title}
      titleId={`latest-posts-${id}`}
      linkAs={Link}
    />
  );
}
