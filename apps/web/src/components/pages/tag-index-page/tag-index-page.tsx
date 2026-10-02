import { TagIndexBreadcrumbs } from '@web/components/features/tag-index/tag-index-breadcrumbs';
import { PageShell } from '@web/components/page-templates/page-shell';
import { getTagIndexPage } from '@web/server/tag-index/get-tag-index-page/get-tag-index-page';
import { guardPageLoaderResult } from '@web/utils/guard-page-loader-result';

import { TagIndexModuleRenderer } from './tag-index-module-renderer';

export const TagIndexPage = async () => {
  const result = await getTagIndexPage();
  const { headingBlock, hero, modules } = guardPageLoaderResult(
    result,
    'tag_index_page.fetch_failed',
  );

  return (
    <PageShell>
      <PageShell.Breadcrumbs>
        <TagIndexBreadcrumbs />
      </PageShell.Breadcrumbs>
      <TagIndexModuleRenderer
        hero={hero}
        headingBlock={headingBlock}
        modules={modules}
      />
    </PageShell>
  );
};
