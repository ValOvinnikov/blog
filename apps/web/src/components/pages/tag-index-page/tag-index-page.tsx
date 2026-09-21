import { TagIndexBreadcrumbs } from '@web/components/features/tag-index/tag-index-breadcrumbs';
import { PageShell } from '@web/components/page-templates/page-shell';
import { getTagIndexPage } from '@web/server/tag-index/get-tag-index-page';
import { guardPageLoaderResult } from '@web/utils/guard-page-loader-result';

import { TagIndexModuleRenderer } from './tag-index-module-renderer';

type TTagIndexPageProps = { locale: string; tenant: string };

export const TagIndexPage = async ({ locale, tenant }: TTagIndexPageProps) => {
  const result = await getTagIndexPage(tenant);
  const { headingBlock, hero, modules } = guardPageLoaderResult(
    result,
    'tag_index_page.fetch_failed',
  );

  return (
    <PageShell>
      <PageShell.Breadcrumbs>
        <TagIndexBreadcrumbs tenant={tenant} />
      </PageShell.Breadcrumbs>
      <TagIndexModuleRenderer
        hero={hero}
        headingBlock={headingBlock}
        modules={modules}
        locale={locale}
        tenant={tenant}
      />
    </PageShell>
  );
};
