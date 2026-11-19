import { TopicIndexBreadcrumbs } from '@web/components/features/topic-index/topic-index-breadcrumbs';
import { TaxonomyIndexPage } from '@web/components/pages/taxonomy-index-page';
import { TOPIC_INDEX_LOG } from '@web/constants/topic-index';
import { getTopicIndexPage } from '@web/server/topic-index/get-topic-index-page/get-topic-index-page';
import { guardPageLoaderResult } from '@web/utils/guard-page-loader-result';
import { redirectMissingLanguagePage } from '@web/utils/redirect-missing-language-page';

export const TopicIndexPage = async () => {
  const result = await getTopicIndexPage();
  await redirectMissingLanguagePage(result);
  const pageData = guardPageLoaderResult(
    result,
    TOPIC_INDEX_LOG.PAGE_FETCH_FAILED,
  );
  const { hero } = pageData;

  return (
    <TaxonomyIndexPage
      pageData={pageData}
      breadcrumbs={<TopicIndexBreadcrumbs isAbovePageHeading={!hero} />}
    />
  );
};
