import { TopicIndexBreadcrumbs } from '@web/components/features/topic-index/topic-index-breadcrumbs';
import { PageShell } from '@web/components/page-templates/page-shell';
import { TOPIC_INDEX_LOG } from '@web/constants/topic-index';
import { getTopicIndexPage } from '@web/server/topic-index/get-topic-index-page/get-topic-index-page';
import { guardPageLoaderResult } from '@web/utils/guard-page-loader-result';
import { redirectMissingLanguagePage } from '@web/utils/redirect-missing-language-page';

import { TopicIndexModuleRenderer } from './topic-index-module-renderer';

export const TopicIndexPage = async () => {
  const result = await getTopicIndexPage();
  await redirectMissingLanguagePage(result);
  const { headingBlock, headingAlignment, hero, modules } =
    guardPageLoaderResult(result, TOPIC_INDEX_LOG.PAGE_FETCH_FAILED);

  return (
    <PageShell>
      <PageShell.Breadcrumbs>
        <TopicIndexBreadcrumbs isAbovePageHeading={!hero} />
      </PageShell.Breadcrumbs>
      <TopicIndexModuleRenderer
        hero={hero}
        headingBlock={headingBlock}
        headingAlignment={headingAlignment}
        modules={modules}
      />
    </PageShell>
  );
};
