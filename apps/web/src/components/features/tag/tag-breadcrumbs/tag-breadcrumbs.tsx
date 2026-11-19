import { routes } from '@shinefold/config';
import { TaxonomyBreadcrumbs } from '@web/components/shared/taxonomy-breadcrumbs';
import { TAG_LOG } from '@web/constants/tag';
import { getTagPage } from '@web/server/tag/get-tag-page/get-tag-page';
import { guardPageLoaderResult } from '@web/utils/guard-page-loader-result';

interface ITagBreadcrumbsProps {
  slug: string;
  isAbovePageHeading?: boolean;
}

export const TagBreadcrumbs = async ({
  slug,
  isAbovePageHeading,
}: ITagBreadcrumbsProps) => {
  const result = await getTagPage(slug);
  const { tag } = guardPageLoaderResult(
    result,
    TAG_LOG.BREADCRUMBS_FETCH_FAILED,
    { slug },
  );

  return (
    <TaxonomyBreadcrumbs
      term={{ label: tag.title, href: routes.tag(slug) }}
      isAbovePageHeading={isAbovePageHeading}
    />
  );
};
