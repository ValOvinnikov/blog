import { TAXONOMY_KIND } from '@shinefold/config';
import { TagBreadcrumbs } from '@web/components/features/tag/tag-breadcrumbs';
import { TaxonomyPage } from '@web/components/pages/taxonomy-page';
import { TAG_LOG } from '@web/constants/tag';
import { getTagPage } from '@web/server/tag/get-tag-page/get-tag-page';
import { guardPageLoaderResult } from '@web/utils/guard-page-loader-result';

interface ITagPageProps {
  slug: string;
  page?: number;
}

export const TagPage = async ({ slug, page }: ITagPageProps) => {
  const result = await getTagPage(slug);
  const pageData = guardPageLoaderResult(result, TAG_LOG.PAGE_FETCH_FAILED, {
    slug,
  });
  const { tag, hero } = pageData;

  return (
    <TaxonomyPage
      kind={TAXONOMY_KIND.TAGS}
      slug={slug}
      page={page}
      term={tag}
      pageData={pageData}
      breadcrumbs={<TagBreadcrumbs slug={slug} isAbovePageHeading={!hero} />}
    />
  );
};
