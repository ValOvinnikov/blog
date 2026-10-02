import { BlogPostingSchema } from '@web/components/features/post/blog-posting-schema';
import { PostArticle } from '@web/components/features/post/post-article';
import { PostBreadcrumbs } from '@web/components/features/post/post-breadcrumbs';
import { BackToTopButton } from '@web/components/shared/back-to-top-button';
import { DepthToggle } from '@web/components/shared/depth-toggle';
import { SkimPanel } from '@web/components/shared/skim-panel';
import { DepthProvider } from '@web/context/depth-provider';
import { getPostPage } from '@web/server/post/get-post-page';
import { guardPageLoaderResult } from '@web/utils/guard-page-loader-result';

import { BlogPostModuleRenderer } from './blog-post-module-renderer';
import { blogPostPageVariants } from './blog-post-page-variants';

type TBlogPostPageProps = { slug: string };

const s = blogPostPageVariants();

/**
 * `/blog/{slug}` composition. Site chrome (`Header`/`Footer`) stays owned by
 * `[tenant]/[locale]/layout.tsx`. Fetches the post once — purely to decide
 * `notFound()`, to gate `DepthProvider`/`DepthToggle` on this post's
 * skim/asides availability, and to render its own `modules[]` — and
 * composes every other concern as a self-fetching part reading the same
 * cached `getPostPage` loader.
 */
export const BlogPostPage = async ({ slug }: TBlogPostPageProps) => {
  const result = await getPostPage(slug);
  const post = guardPageLoaderResult(result, 'blog_post_page.fetch_failed', {
    slug,
  });
  const { id, postTakeaways, hasAsides, modules } = post;
  const hasSkim = Boolean(postTakeaways);

  return (
    <>
      <BlogPostingSchema slug={slug} />
      <PostBreadcrumbs slug={slug} />

      <main className={s.root()}>
        <div className={s.article()}>
          <DepthProvider hasSkim={hasSkim} hasDeep={hasAsides}>
            <DepthToggle
              hasSkim={hasSkim}
              hasDeep={hasAsides}
              className={s.depthToggle()}
            />
            <PostArticle slug={slug} />
            <SkimPanel takeaways={postTakeaways} />
          </DepthProvider>
        </div>

        {modules.length > 0 && (
          <div className={s.modules()}>
            <BlogPostModuleRenderer
              modules={modules}
              context={{ post: { id } }}
            />
          </div>
        )}
      </main>

      <BackToTopButton />
    </>
  );
};
