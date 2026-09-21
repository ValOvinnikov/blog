import { TopicIndexBreadcrumbs } from '@web/components/features/topic-index/topic-index-breadcrumbs';
import { PageShell } from '@web/components/page-templates/page-shell';
import { getTopicIndexPage } from '@web/server/topic-index/get-topic-index-page';
import { guardPageLoaderResult } from '@web/utils/guard-page-loader-result';

import { TopicIndexModuleRenderer } from './topic-index-module-renderer';

type TTopicIndexPageProps = { locale: string; tenant: string };

export const TopicIndexPage = async ({
  locale,
  tenant,
}: TTopicIndexPageProps) => {
  const result = await getTopicIndexPage(tenant);
  const { headingBlock, hero, modules } = guardPageLoaderResult(
    result,
    'topics_page.fetch_failed',
  );

  return (
    <PageShell>
      <PageShell.Breadcrumbs>
        <TopicIndexBreadcrumbs tenant={tenant} />
      </PageShell.Breadcrumbs>
      <TopicIndexModuleRenderer
        hero={hero}
        headingBlock={headingBlock}
        modules={modules}
        locale={locale}
        tenant={tenant}
      />
    </PageShell>
  );
};
