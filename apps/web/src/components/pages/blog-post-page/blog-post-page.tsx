import { hasLength } from '@shinefold/utils/primitives';
import { BlogPostingSchema } from '@web/components/features/post/blog-posting-schema';
import { PostArticle } from '@web/components/features/post/post-article';
import { PostBreadcrumbs } from '@web/components/features/post/post-breadcrumbs';
import { BackToTopButton } from '@web/components/shared/back-to-top-button';
import { getPostPage } from '@web/server/post/get-post-page/get-post-page';
import { guardPageLoaderResult } from '@web/utils/guard-page-loader-result';

import { BlogPostModuleRenderer } from './blog-post-module-renderer';
import { blogPostPageVariants } from './blog-post-page-variants';

type TBlogPostPageProps = { slug: string };

const s = blogPostPageVariants();

export const BlogPostPage = async ({ slug }: TBlogPostPageProps) => {
  const result = await getPostPage(slug);
  const post = guardPageLoaderResult(result, 'blog_post_page.fetch_failed', {
    slug,
  });
  const { id, modules } = post;

  return (
    <>
      <BlogPostingSchema slug={slug} />
      <PostBreadcrumbs slug={slug} />

      <main className={s.root()}>
        <div className={s.article()}>
          <PostArticle slug={slug} />
        </div>

        {hasLength(modules) && (
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
