import { PostIndexBreadcrumbs } from '@web/components/features/post-index/post-index-breadcrumbs';
import { PostIndexTopicChips } from '@web/components/features/post-index/post-index-topic-chips';
import { PageShell } from '@web/components/page-templates/page-shell';
import { getPostIndexPage } from '@web/server/post-index/get-post-index-page';
import { guardPageLoaderResult } from '@web/utils/guard-page-loader-result';

import { PostIndexModuleRenderer } from './post-index-module-renderer';

type TPostIndexPageProps = { page: number; locale: string; tenant: string };

export const PostIndexPage = async ({
  page,
  locale,
  tenant,
}: TPostIndexPageProps) => {
  const result = await getPostIndexPage(tenant);
  const pageData = guardPageLoaderResult(result, 'blog_list_page.fetch_failed');
  const { headingBlock, hero, modules } = pageData;

  return (
    <PageShell>
      <PageShell.Breadcrumbs>
        <PostIndexBreadcrumbs tenant={tenant} />
      </PageShell.Breadcrumbs>
      <PostIndexModuleRenderer
        hero={hero}
        headingBlock={headingBlock}
        modules={modules}
        context={{ page }}
        locale={locale}
        tenant={tenant}
      >
        <PostIndexTopicChips tenant={tenant} />
      </PostIndexModuleRenderer>
    </PageShell>
  );
};
