import { service } from '@blog/service';
import { PostsSection } from '@blog/ui/organisms';
import { Section } from '@web/components/shared/section';
import { SmartLink } from '@web/components/shared/smart-link';
import { toPostListItems } from '@web/utils/to-post-list-items';

export interface IPostListModuleProps {
  id: string;
  locale: string;
}

/**
 * PostListModule — fetches `module_postList` data and renders it through the
 * `PostsSection` organism, wrapped in `Section` (web's sole per-module
 * landmark) for the CMS-authored `brandVariant`/`appearance`. The only place
 * this module's service and ui meet.
 */
export async function PostListModule({ id }: IPostListModuleProps) {
  const result = await service.modules.postList.v1.getPostList(id);

  if (!result.ok) return null;

  const { brandVariant, title, posts, appearance } = result.data;
  const titleId = `latest-posts-${id}`;

  const items = await toPostListItems(posts);

  // No posts resolved (e.g. the referenced/latest posts are unpublished or
  // filtered to zero) — `PostsSection` renders nothing without an
  // `emptyMessage`, so skip `Section` entirely rather than emit an empty
  // landmark whose `aria-labelledby` points at a heading id that never
  // renders.
  if (items.length === 0) return null;

  return (
    <Section
      brandVariant={brandVariant}
      appearance={appearance}
      titleId={titleId}
      dataTestId={`post-list-module-${id}`}
    >
      <PostsSection
        posts={items}
        title={title}
        titleId={titleId}
        linkAs={SmartLink}
        wrapped
      />
    </Section>
  );
}
