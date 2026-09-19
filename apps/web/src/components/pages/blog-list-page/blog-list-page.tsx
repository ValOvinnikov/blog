import { BlogListBreadcrumbs } from '@web/components/features/blog-list/blog-list-breadcrumbs';
import { BlogListTopicChips } from '@web/components/features/blog-list/blog-list-topic-chips';
import { PageShell } from '@web/components/page-templates/page-shell';
import { getBlogListPage } from '@web/server/blog-list/get-blog-list-page';
import { guardPageLoaderResult } from '@web/utils/guard-page-loader-result';

import { BlogListModuleRenderer } from './blog-list-module-renderer';

type TBlogListPageProps = { page: number; locale: string; tenant: string };

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
      <BlogListModuleRenderer
        hero={hero}
        headingBlock={headingBlock}
        modules={modules}
        context={{ page }}
        locale={locale}
        tenant={tenant}
      >
        <BlogListTopicChips tenant={tenant} />
      </BlogListModuleRenderer>
    </PageShell>
  );
};
