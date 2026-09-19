import { TopicsIndexBreadcrumbs } from '@web/components/features/topics-index/topics-index-breadcrumbs';
import { PageShell } from '@web/components/page-templates/page-shell';
import { getTopicsIndexPage } from '@web/server/topics-index/get-topics-index-page';
import { guardPageLoaderResult } from '@web/utils/guard-page-loader-result';

import { TopicsModuleRenderer } from './topics-module-renderer';

type TTopicsPageProps = { locale: string; tenant: string };

export const TopicsPage = async ({ locale, tenant }: TTopicsPageProps) => {
  const result = await getTopicsIndexPage(tenant);
  const { headingBlock, hero, modules } = guardPageLoaderResult(
    result,
    'topics_page.fetch_failed',
  );

  return (
    <PageShell>
      <PageShell.Breadcrumbs>
        <TopicsIndexBreadcrumbs tenant={tenant} />
      </PageShell.Breadcrumbs>
      <TopicsModuleRenderer
        hero={hero}
        headingBlock={headingBlock}
        modules={modules}
        locale={locale}
        tenant={tenant}
      />
    </PageShell>
  );
};
