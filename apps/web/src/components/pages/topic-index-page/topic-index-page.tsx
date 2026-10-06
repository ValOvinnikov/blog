import { TopicIndexBreadcrumbs } from '@web/components/features/topic-index/topic-index-breadcrumbs';
import { PageShell } from '@web/components/page-templates/page-shell';
import { getTopicIndexPage } from '@web/server/topic-index/get-topic-index-page/get-topic-index-page';
import { guardPageLoaderResult } from '@web/utils/guard-page-loader-result';
import { redirectMissingLanguagePage } from '@web/utils/redirect-missing-language-page';

import { TopicIndexModuleRenderer } from './topic-index-module-renderer';

export const TopicIndexPage = async () => {
  const result = await getTopicIndexPage();
  await redirectMissingLanguagePage(result);
  const { headingBlock, hero, modules } = guardPageLoaderResult(
    result,
    'topic_index_page.fetch_failed',
  );

  return (
    <PageShell>
      <PageShell.Breadcrumbs>
        <TopicIndexBreadcrumbs />
      </PageShell.Breadcrumbs>
      <TopicIndexModuleRenderer
        hero={hero}
        headingBlock={headingBlock}
        modules={modules}
      />
    </PageShell>
  );
};
