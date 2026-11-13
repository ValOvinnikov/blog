import { TagIndexBreadcrumbs } from '@web/components/features/tag-index/tag-index-breadcrumbs';
import { PageShell } from '@web/components/page-templates/page-shell';
import { TAG_INDEX_LOG } from '@web/constants/tag-index';
import { getTagIndexPage } from '@web/server/tag-index/get-tag-index-page/get-tag-index-page';
import { guardPageLoaderResult } from '@web/utils/guard-page-loader-result';
import { redirectMissingLanguagePage } from '@web/utils/redirect-missing-language-page';

import { TagIndexModuleRenderer } from './tag-index-module-renderer';

export const TagIndexPage = async () => {
  const result = await getTagIndexPage();
  await redirectMissingLanguagePage(result);
  const { headingBlock, headingAlignment, hero, modules } =
    guardPageLoaderResult(result, TAG_INDEX_LOG.PAGE_FETCH_FAILED);

  return (
    <PageShell>
      <PageShell.Breadcrumbs>
        <TagIndexBreadcrumbs isAbovePageHeading={!hero} />
      </PageShell.Breadcrumbs>
      <TagIndexModuleRenderer
        hero={hero}
        headingBlock={headingBlock}
        headingAlignment={headingAlignment}
        modules={modules}
      />
    </PageShell>
  );
};
