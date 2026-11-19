import { TagIndexBreadcrumbs } from '@web/components/features/tag-index/tag-index-breadcrumbs';
import { TaxonomyIndexPage } from '@web/components/pages/taxonomy-index-page';
import { TAG_INDEX_LOG } from '@web/constants/tag-index';
import { getTagIndexPage } from '@web/server/tag-index/get-tag-index-page/get-tag-index-page';
import { guardPageLoaderResult } from '@web/utils/guard-page-loader-result';
import { redirectMissingLanguagePage } from '@web/utils/redirect-missing-language-page';

export const TagIndexPage = async () => {
  const result = await getTagIndexPage();
  await redirectMissingLanguagePage(result);
  const pageData = guardPageLoaderResult(
    result,
    TAG_INDEX_LOG.PAGE_FETCH_FAILED,
  );
  const { hero } = pageData;

  return (
    <TaxonomyIndexPage
      pageData={pageData}
      breadcrumbs={<TagIndexBreadcrumbs isAbovePageHeading={!hero} />}
    />
  );
};
