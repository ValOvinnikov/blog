import { BlogListBreadcrumbs } from '@web/components/features/blog-list/blog-list-breadcrumbs';
import { BlogListTopicChips } from '@web/components/features/blog-list/blog-list-topic-chips';
import { BlogPageTemplate } from '@web/components/page-templates/blog-page-template';
import { HeroSlot } from '@web/modules/hero-slot';
import { ModuleRenderer } from '@web/modules/module-renderer';
import { PostListModule } from '@web/modules/post-list/post-list-module';
import { getBlogListPage } from '@web/server/blog-list/get-blog-list-page';
import { guardPageLoaderResult } from '@web/utils/guard-page-loader-result';

type TBlogListPageProps = { page: number; locale: string; tenant: string };

/**
 * `/blog` (page 1) and `/blog/page/[page]` (pages ≥ 2) composition. Fetches
 * the `page_blog` shell once — for its heading/hero and the page-builder
 * `modules[]` — and composes every other concern as a self-fetching part
 * reading the same cached `getBlogListPage` loader or its own data.
 */
export const BlogListPage = async ({
  page,
  locale,
  tenant,
}: TBlogListPageProps) => {
  const result = await getBlogListPage(tenant);
  const pageData = guardPageLoaderResult(result, 'blog_list_page.fetch_failed');
  const { heading, supportingText, hero, modules, postListId } = pageData;

  return (
    <>
      <BlogListBreadcrumbs tenant={tenant} />

      <BlogPageTemplate
        heading={heading}
        supportingText={supportingText}
        hero={
          hero && (
            <HeroSlot
              id={hero.id}
              type={hero.type}
              locale={locale}
              tenant={tenant}
            />
          )
        }
        topicChips={<BlogListTopicChips tenant={tenant} />}
        modules={
          <>
            <PostListModule
              id={postListId}
              locale={locale}
              tenant={tenant}
              page={page}
            />
            <ModuleRenderer modules={modules} locale={locale} tenant={tenant} />
          </>
        }
      />
    </>
  );
};
