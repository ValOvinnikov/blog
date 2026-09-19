import { TagsIndexBreadcrumbs } from '@web/components/features/tags-index/tags-index-breadcrumbs';
import { PageShell } from '@web/components/page-templates/page-shell';
import { getTagsIndexPage } from '@web/server/tags-index/get-tags-index-page';
import { guardPageLoaderResult } from '@web/utils/guard-page-loader-result';

import { TagsModuleRenderer } from './tags-module-renderer';

type TTagsPageProps = { locale: string; tenant: string };

export const TagsPage = async ({ locale, tenant }: TTagsPageProps) => {
  const result = await getTagsIndexPage(tenant);
  const { headingBlock, hero, modules } = guardPageLoaderResult(
    result,
    'tags_page.fetch_failed',
  );

  return (
    <PageShell>
      <PageShell.Breadcrumbs>
        <TagsIndexBreadcrumbs tenant={tenant} />
      </PageShell.Breadcrumbs>
      <TagsModuleRenderer
        hero={hero}
        headingBlock={headingBlock}
        modules={modules}
        locale={locale}
        tenant={tenant}
      />
    </PageShell>
  );
};
