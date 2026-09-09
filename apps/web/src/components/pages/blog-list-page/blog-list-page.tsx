import { BlogListBreadcrumbs } from '@web/components/features/blog-list/blog-list-breadcrumbs';
import { BlogListTopicChips } from '@web/components/features/blog-list/blog-list-topic-chips';
import { PageShell } from '@web/components/page-templates/page-shell';
import { PageIntro } from '@web/components/shared/page-intro';
import { ModuleRenderer } from '@web/modules/module-renderer';
import { getBlogListPage } from '@web/server/blog-list/get-blog-list-page';
import { guardPageLoaderResult } from '@web/utils/guard-page-loader-result';

type TBlogListPageProps = { page: number; locale: string; tenant: string };

/**
 * `/blog` (page 1) and `/blog/page/[page]` (pages ≥ 2) composition. Fetches
 * the `page_blog` shell once and composes every other concern as a
 * self-fetching part reading the same cached `getBlogListPage` loader or its
 * own data.
 */
export const BlogListPage = async ({
  page,
  locale,
  tenant,
}: TBlogListPageProps) => {
  const result = await getBlogListPage(tenant);
  const pageData = guardPageLoaderResult(result, 'blog_list_page.fetch_failed');
  const { headingBlock, hero, modules } = pageData;

  return (
    <PageShell>
      <PageShell.Breadcrumbs>
        <BlogListBreadcrumbs tenant={tenant} />
      </PageShell.Breadcrumbs>
      <PageShell.Heading>
        <PageIntro
          hero={hero}
          headingBlock={headingBlock}
          locale={locale}
          tenant={tenant}
        />
      </PageShell.Heading>
      <PageShell.Content>
        <BlogListTopicChips tenant={tenant} />
        <ModuleRenderer
          modules={modules}
          context={{ page }}
          locale={locale}
          tenant={tenant}
        />
      </PageShell.Content>
    </PageShell>
  );
};
