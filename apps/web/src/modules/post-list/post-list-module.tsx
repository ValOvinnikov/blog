import { routes } from '@blog/config';
import { service } from '@blog/service';
import { PostsSection } from '@blog/ui/organisms';
import { Link } from '@web/i18n/navigation';
import { formatDate } from '@web/utils/format-date';

export interface IPostListModuleProps {
  id: string;
  locale: string;
}

/**
 * PostListModule — fetches `module_postList` data and renders it through the
 * `PostsSection` organism. The only place this module's service and ui meet.
 */
export async function PostListModule({ id, locale }: IPostListModuleProps) {
  const result = await service.modules.postList.v1.getPostList(id);

  if (!result.ok) return null;

  const { title, posts } = result.data;

  const items = posts.map((post) => ({
    id: post.id,
    href: routes.post(post.slug),
    title: post.title,
    excerpt: post.excerpt,
    publishedAt: post.publishedAt,
    formattedDate: formatDate(post.publishedAt, locale),
    categories: post.categories,
  }));

  return (
    <PostsSection
      posts={items}
      title={title}
      titleId={`latest-posts-${id}`}
      linkAs={Link}
    />
  );
}
