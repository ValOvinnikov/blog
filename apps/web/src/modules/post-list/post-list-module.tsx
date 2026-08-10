import { service } from '@blog/service';
import { Section } from '@blog/ui/atoms';
import { PostsSection } from '@blog/ui/organisms';
import { SmartLink } from '@web/components/shared/smart-link';
import { toPostListItems } from '@web/utils/to-post-list-items';

import { postListModuleVariants } from './post-list-module-variants';

export interface IPostListModuleProps {
  id: string;
  locale: string;
}

/**
 * PostListModule — fetches `module_postList` data and renders it through the
 * `PostsSection` organism, wrapped in `Section` for the CMS-authored
 * `appearance`. The only place this module's service and ui meet.
 *
 * `PostsSection` also renders outside the module pipeline (archive pages),
 * where it still owns its own top margin — so that margin is only
 * neutralized here, at this one call site, via `postListModuleVariants`,
 * rather than in `PostsSection` itself (which would regress those other
 * pages).
 */
export async function PostListModule({ id }: IPostListModuleProps) {
  const result = await service.modules.postList.v1.getPostList(id);

  if (!result.ok) return null;

  const { title, posts, appearance } = result.data;

  const items = await toPostListItems(posts);

  return (
    <Section appearance={appearance} dataTestId={`post-list-module-${id}`}>
      <PostsSection
        posts={items}
        title={title}
        titleId={`latest-posts-${id}`}
        linkAs={SmartLink}
        className={postListModuleVariants()}
      />
    </Section>
  );
}
