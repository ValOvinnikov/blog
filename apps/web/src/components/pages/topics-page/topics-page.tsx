import { TAXONOMY_KIND } from '@blog/config';
import { TopicsIndexBreadcrumbs } from '@web/components/features/topics-index/topics-index-breadcrumbs';
import { PageShell } from '@web/components/page-templates/page-shell';
import { PageIntro } from '@web/components/shared/page-intro';
import { TaxonomyListModule } from '@web/modules/taxonomy-list/taxonomy-list-module';
import { getTopicsIndexPage } from '@web/server/topics-index/get-topics-index-page';
import { guardPageLoaderResult } from '@web/utils/guard-page-loader-result';
import { getTranslations } from 'next-intl/server';

type TTopicsPageProps = { locale: string; tenant: string };

/**
 * TopicsPage — `/topics` composition. Fetches the `page_topicIndex`
 * document once — for its heading/supportingText and the `taxonomyList`
 * reference — and composes every other concern as a self-fetching part
 * reading the same cached `getTopicsIndexPage` loader or its own data.
 */
export const TopicsPage = async ({ locale, tenant }: TTopicsPageProps) => {
  const [result, t] = await Promise.all([
    getTopicsIndexPage(tenant),
    getTranslations('topicsPage'),
  ]);

  const { heading, supportingText, taxonomyListId } = guardPageLoaderResult(
    result,
    'topics_page.fetch_failed',
  );

  return (
    <PageShell>
      <PageShell.Breadcrumbs>
        <TopicsIndexBreadcrumbs tenant={tenant} />
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
            fallbackTaxonomy: TAXONOMY_KIND.TOPICS,
            titleId: 'topic-list-title',
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
