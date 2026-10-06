import { PostIndexBreadcrumbs } from '@web/components/features/post-index/post-index-breadcrumbs';
import { PostIndexTopicChips } from '@web/components/features/post-index/post-index-topic-chips';
import { PageShell } from '@web/components/page-templates/page-shell';
import { getPostIndexPage } from '@web/server/post-index/get-post-index-page/get-post-index-page';
import { guardPageLoaderResult } from '@web/utils/guard-page-loader-result';
import { redirectMissingLanguagePage } from '@web/utils/redirect-missing-language-page';

import { PostIndexModuleRenderer } from './post-index-module-renderer';

type TPostIndexPageProps = { page: number };

export const PostIndexPage = async ({ page }: TPostIndexPageProps) => {
  const result = await getPostIndexPage();
  await redirectMissingLanguagePage(result);
  const pageData = guardPageLoaderResult(
    result,
    'post_index_page.fetch_failed',
  );
  const { headingBlock, hero, modules } = pageData;

  return (
    <PageShell>
      <PageShell.Breadcrumbs>
        <PostIndexBreadcrumbs />
      </PageShell.Breadcrumbs>
      <PostIndexModuleRenderer
        hero={hero}
        headingBlock={headingBlock}
        modules={modules}
        context={{ page }}
      >
        <PostIndexTopicChips />
      </PostIndexModuleRenderer>
    </PageShell>
  );
};
