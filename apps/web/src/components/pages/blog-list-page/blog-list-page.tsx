import { BlogListBreadcrumbs } from '@web/components/features/blog-list/blog-list-breadcrumbs';
import { BlogListTopicChips } from '@web/components/features/blog-list/blog-list-topic-chips';
import { PageShell } from '@web/components/page-templates/page-shell';
import { getBlogListPage } from '@web/server/blog-list/get-blog-list-page';
import { guardPageLoaderResult } from '@web/utils/guard-page-loader-result';
import { resolvePageIntroAndContent } from '@web/utils/resolve-page-intro-and-content';

type TBlogListPageProps = { page: number; locale: string; tenant: string };

/**
 * `/blog` (page 1) and `/blog/page/[page]` (pages ≥ 2) composition. Fetches
 * the `page_postIndex` shell once and composes every other concern as a
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
  const { intro, content } = await resolvePageIntroAndContent({
    hero,
    headingBlock,
    modules,
    context: { page },
    locale,
    tenant,
  });

  return (
    <PageShell>
      <PageShell.Breadcrumbs>
        <BlogListBreadcrumbs tenant={tenant} />
      </PageShell.Breadcrumbs>
      <PageShell.Heading>{intro}</PageShell.Heading>
      <PageShell.Content>
        <BlogListTopicChips tenant={tenant} />
        {content}
      </PageShell.Content>
    </PageShell>
  );
};
