import { routes, TAXONOMY_KIND } from '@blog/config';
import { service } from '@blog/service';
import type { IBreadcrumbItem } from '@blog/ui/molecules/breadcrumbs';
import { TaxonomyListModule } from '@web/modules/taxonomy-list/taxonomy-list-module';
import { getTenantBaseUrl } from '@web/server/tenant/get-tenant-base-url';
import { getTenantSanityContext } from '@web/server/tenant/get-tenant-sanity-context';
import { buildBreadcrumbListSchema } from '@web/utils/build-breadcrumb-list-schema';
import { guardPageLoaderResult } from '@web/utils/guard-page-loader-result';
import { getTranslations } from 'next-intl/server';

import { TopicsPageView } from './topics-page-view';

type TTopicsPageProps = { tenant: string };

/**
 * TopicsPage — `/topics` composition: fetches the `page_topicIndex`
 * document via `service.pages.topicIndex.v1.getIndexPage()`, then hands the
 * resolved data — plus the pre-rendered `taxonomyList` slot content — to
 * `TopicsPageView`.
 */
export const TopicsPage = async ({ tenant }: TTopicsPageProps) => {
  const tenantContext = await getTenantSanityContext(tenant);
  const [result, breadcrumbsT, t] = await Promise.all([
    service.pages.topicIndex.v1.getIndexPage(tenantContext),
    getTranslations('breadcrumbs'),
    getTranslations('topicsPage'),
  ]);

  const { heading, supportingText, taxonomyListId } = guardPageLoaderResult(
    result,
    'topics_page.fetch_failed',
  );

  const siteUrl = (await getTenantBaseUrl(tenant)) ?? '';
  const breadcrumbTrail: IBreadcrumbItem[] = [
    { label: breadcrumbsT('home'), href: routes.home() },
    { label: breadcrumbsT('topics'), href: routes.topics() },
  ];
  const breadcrumbListSchema = buildBreadcrumbListSchema(
    breadcrumbTrail,
    siteUrl,
  );

  return (
    <TopicsPageView
      heading={heading}
      supportingText={supportingText}
      breadcrumbTrail={breadcrumbTrail}
      breadcrumbAriaLabel={breadcrumbsT('ariaLabel')}
      breadcrumbListSchema={breadcrumbListSchema}
      taxonomyListContent={
        <TaxonomyListModule
          id={taxonomyListId}
          tenant={tenant}
          taxonomy={TAXONOMY_KIND.TOPICS}
          titleId="topic-list-title"
          dataTestId={`taxonomy-list-module-${taxonomyListId}`}
          headingLevel={2}
          accessibleTitle={heading}
          emptyMessage={t('empty')}
          buildHref={(slug) => routes.topic(slug)}
          formatPostCount={(count) => t('postsCount', { count })}
        />
      }
    />
  );
};
