import { TAXONOMY_KIND } from '@blog/config';
import { TagsIndexBreadcrumbs } from '@web/components/features/tags-index/tags-index-breadcrumbs';
import { PageShell } from '@web/components/page-templates/page-shell';
import { PageIntro } from '@web/components/shared/page-intro';
import { TaxonomyListModule } from '@web/modules/taxonomy-list/taxonomy-list-module';
import { getTagsIndexPage } from '@web/server/tags-index/get-tags-index-page';
import { guardPageLoaderResult } from '@web/utils/guard-page-loader-result';
import { getTranslations } from 'next-intl/server';

type TTagsPageProps = { locale: string; tenant: string };

/**
 * TagsPage — `/tags` composition. Fetches the `page_tagIndex` document once
 * — for its heading/supportingText and the `taxonomyList` reference — and
 * composes every other concern as a self-fetching part reading the same
 * cached `getTagsIndexPage` loader or its own data.
 */
export const TagsPage = async ({ locale, tenant }: TTagsPageProps) => {
  const [result, t] = await Promise.all([
    getTagsIndexPage(tenant),
    getTranslations('tagsPage'),
  ]);

  const { heading, supportingText, taxonomyListId } = guardPageLoaderResult(
    result,
    'tags_page.fetch_failed',
  );

  return (
    <PageShell>
      <PageShell.Breadcrumbs>
        <TagsIndexBreadcrumbs tenant={tenant} />
      </PageShell.Breadcrumbs>
      <PageShell.Heading>
        <PageIntro
          headingBlock={{ heading, supportingText }}
          hasTrailingSpace={false}
          locale={locale}
          tenant={tenant}
        />
      </PageShell.Heading>
      <PageShell.Content>
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
      </PageShell.Content>
    </PageShell>
  );
};
