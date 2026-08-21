import { routes, TAXONOMY_KIND } from '@blog/config';
import { service } from '@blog/service';
import {
  Breadcrumbs,
  type IBreadcrumbItem,
} from '@blog/ui/molecules/breadcrumbs';
import { BlogPageTemplate } from '@web/components/page-templates/blog-page-template';
import { BreadcrumbBar } from '@web/components/shared/breadcrumb-bar';
import { JsonLd } from '@web/components/shared/json-ld';
import { SmartLink } from '@web/components/shared/smart-link';
import { TaxonomyListModule } from '@web/modules/taxonomy-list/taxonomy-list-module';
import { buildBreadcrumbListSchema } from '@web/utils/build-breadcrumb-list-schema';
import { env } from '@web/utils/env/env';
import { logger } from '@web/utils/logger/logger';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

/**
 * TopicsPage — `/topics` composition: fetches the `page_topicIndex`
 * document via `service.pages.topicIndex.v1.getIndexPage()` and renders it
 * through `BlogPageTemplate` (heading + supporting text) with the
 * `taxonomyList` slot rendered by `TaxonomyListModule` as a full-bleed
 * `Section` sibling, matching `BlogListPage`. Renders a `Home › Topics`
 * `Breadcrumbs` trail (plus its `BreadcrumbList` JSON-LD) inside a
 * `BreadcrumbBar` sibling before `<main>`.
 *
 * Unlike the topic chip row (`getTopicsSafely`), this page's entire content
 * *is* the taxonomy list, so a fetch failure 404s rather than rendering
 * breadcrumbs and nothing else at a 200 — matching `BlogListPage`.
 */
export const TopicsPage = async () => {
  const [result, breadcrumbsT, t] = await Promise.all([
    service.pages.topicIndex.v1.getIndexPage(),
    getTranslations('breadcrumbs'),
    getTranslations('topicsPage'),
  ]);

  if (!result.ok) {
    logger.error('topics_page.fetch_failed', { error: result.error });
    notFound();
  }

  const { heading, supportingText, taxonomyListId } = result.data;

  const siteUrl = env.NEXT_PUBLIC_SITE_URL ?? '';
  const trail: IBreadcrumbItem[] = [
    { label: breadcrumbsT('home'), href: routes.home() },
    { label: breadcrumbsT('topics'), href: routes.topics() },
  ];
  const breadcrumbListSchema = buildBreadcrumbListSchema(trail, siteUrl);

  return (
    <>
      {breadcrumbListSchema && <JsonLd schema={breadcrumbListSchema} />}

      <BreadcrumbBar>
        <Breadcrumbs
          items={trail}
          ariaLabel={breadcrumbsT('ariaLabel')}
          linkAs={SmartLink}
        />
      </BreadcrumbBar>

      <BlogPageTemplate
        heading={heading}
        supportingText={supportingText}
        modules={
          <TaxonomyListModule
            id={taxonomyListId}
            taxonomy={TAXONOMY_KIND.TOPICS}
            titleId="topic-list-title"
            dataTestId={`taxonomy-list-module-${taxonomyListId}`}
            titleFallback={heading}
            emptyMessage={t('empty')}
            buildHref={(slug) => routes.topic(slug)}
            formatPostCount={(count) => t('postsCount', { count })}
          />
        }
      />
    </>
  );
};
