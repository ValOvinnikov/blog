import { TopicsIndexBreadcrumbs } from '@web/components/features/topics-index/topics-index-breadcrumbs';
import { PageShell } from '@web/components/page-templates/page-shell';
import { PageIntro } from '@web/components/shared/page-intro';
import { ModuleRenderer } from '@web/modules/module-renderer';
import { getTopicsIndexPage } from '@web/server/topics-index/get-topics-index-page';
import { guardPageLoaderResult } from '@web/utils/guard-page-loader-result';

type TTopicsPageProps = { locale: string; tenant: string };

/**
 * TopicsPage — `/topics` composition. Fetches the `page_topicIndex`
 * document once — for its hero/heading and `modules[]` — and composes every
 * other concern as a self-fetching part reading the same cached
 * `getTopicsIndexPage` loader or its own data.
 */
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
      <PageShell.Heading>
        <PageIntro
          hero={hero}
          headingBlock={headingBlock}
          hasTrailingSpace={false}
          locale={locale}
          tenant={tenant}
        />
      </PageShell.Heading>
      <PageShell.Content>
        <ModuleRenderer modules={modules} locale={locale} tenant={tenant} />
      </PageShell.Content>
    </PageShell>
  );
};
