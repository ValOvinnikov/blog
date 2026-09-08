import { TAXONOMY_KIND } from '@blog/config';
import { TagsIndexBreadcrumbs } from '@web/components/features/tags-index/tags-index-breadcrumbs';
import { BlogPageTemplate } from '@web/components/page-templates/blog-page-template';
import { TaxonomyListModule } from '@web/modules/taxonomy-list/taxonomy-list-module';
import { getTagsIndexPage } from '@web/server/tags-index/get-tags-index-page';
import { guardPageLoaderResult } from '@web/utils/guard-page-loader-result';
import { getTranslations } from 'next-intl/server';

type TTagsPageProps = { tenant: string };

/**
 * TagsPage — `/tags` composition. Fetches the `page_tagIndex` document once
 * — for its heading/supportingText and the `taxonomyList` reference — and
 * composes every other concern as a self-fetching part reading the same
 * cached `getTagsIndexPage` loader or its own data.
 */
export const TagsPage = async ({ tenant }: TTagsPageProps) => {
  const [result, t] = await Promise.all([
    getTagsIndexPage(tenant),
    getTranslations('tagsPage'),
  ]);

  const { heading, supportingText, taxonomyListId } = guardPageLoaderResult(
    result,
    'tags_page.fetch_failed',
  );

  return (
    <>
      <TagsIndexBreadcrumbs tenant={tenant} />

      <BlogPageTemplate
        heading={heading}
        supportingText={supportingText}
        modules={
          <TaxonomyListModule
            id={taxonomyListId}
            tenant={tenant}
            slot={{
              fallbackTaxonomy: TAXONOMY_KIND.TAGS,
              titleId: 'tag-list-title',
              dataTestId: `taxonomy-list-module-${taxonomyListId}`,
              headingLevel: 2,
              accessibleTitle: heading,
              emptyMessage: t('empty'),
            }}
          />
        }
      />
    </>
  );
};
