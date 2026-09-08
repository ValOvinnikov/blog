import { BlogPostingSchema } from '@web/components/features/post/blog-posting-schema';
import { PostArticle } from '@web/components/features/post/post-article';
import { PostBreadcrumbs } from '@web/components/features/post/post-breadcrumbs';
import { PostNewsletter } from '@web/components/features/post/post-newsletter';
import { PostRelated } from '@web/components/features/post/post-related';
import { BackToTopButton } from '@web/components/shared/back-to-top-button';
import { DepthToggle } from '@web/components/shared/depth-toggle';
import { SkimPanel } from '@web/components/shared/skim-panel';
import { DepthProvider } from '@web/context/depth-provider';
import { getPostPage } from '@web/server/post/get-post-page';
import { guardPageLoaderResult } from '@web/utils/guard-page-loader-result';

import { blogPostPageVariants } from './blog-post-page-variants';

type TBlogPostPageProps = { slug: string; tenant: string };

const s = blogPostPageVariants();

/**
 * `/blog/{slug}` composition. Site chrome (`Header`/`Footer`) stays owned by
 * `[tenant]/[locale]/layout.tsx`. Fetches the post once — purely to decide
 * `notFound()` and to gate `DepthProvider`/`DepthToggle` on this post's
 * skim/asides availability — and composes every other concern as a
 * self-fetching part reading the same cached `getPostPage` loader.
 */
export const BlogPostPage = async ({ slug, tenant }: TBlogPostPageProps) => {
  const result = await getPostPage(slug, tenant);
  const post = guardPageLoaderResult(result, 'blog_post_page.fetch_failed', {
    slug,
  });
  const { skim, hasAsides } = post;
  const hasSkim = Boolean(skim);

  return (
    <>
      <BlogPostingSchema slug={slug} tenant={tenant} />
      <PostBreadcrumbs slug={slug} tenant={tenant} />

      <main className={s.root()}>
        <DepthProvider hasSkim={hasSkim} hasDeep={hasAsides}>
          <DepthToggle
            hasSkim={hasSkim}
            hasDeep={hasAsides}
            className={s.depthToggle()}
          />
          <PostArticle slug={slug} tenant={tenant} />
          <SkimPanel skim={skim} />
        </DepthProvider>

        <PostRelated slug={slug} tenant={tenant} />
        <PostNewsletter slug={slug} tenant={tenant} />
      </main>

      <BackToTopButton />
    </>
  );
};
