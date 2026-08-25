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
 * TagsPage — `/tags` composition: fetches the `page_tagIndex` document via
 * `service.pages.tagIndex.v1.getIndexPage()` and renders it through
 * `BlogPageTemplate` (heading + supporting text) with the `taxonomyList`
 * slot rendered by `TaxonomyListModule` as a full-bleed `Section` sibling,
 * matching `TopicsPage`. Renders a `Home › Tags` `Breadcrumbs` trail (plus
 * its `BreadcrumbList` JSON-LD) inside a `BreadcrumbBar` sibling before
 * `<main>`.
 */
export const TagsPage = async () => {
  const [result, breadcrumbsT, t] = await Promise.all([
    service.pages.tagIndex.v1.getIndexPage(),
    getTranslations('breadcrumbs'),
    getTranslations('tagsPage'),
  ]);

  if (!result.ok) {
    logger.error('tags_page.fetch_failed', { error: result.error });
    notFound();
  }

  if (!result.data) {
    notFound();
  }

  const { heading, supportingText, taxonomyListId } = result.data;

  const siteUrl = env.NEXT_PUBLIC_SITE_URL ?? '';
  const trail: IBreadcrumbItem[] = [
    { label: breadcrumbsT('home'), href: routes.home() },
    { label: breadcrumbsT('tags'), href: routes.tags() },
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
            taxonomy={TAXONOMY_KIND.TAGS}
            titleId="tag-list-title"
            dataTestId={`taxonomy-list-module-${taxonomyListId}`}
            accessibleTitle={heading}
            emptyMessage={t('empty')}
            buildHref={(slug) => routes.tag(slug)}
            formatPostCount={(count) => t('postsCount', { count })}
          />
        }
      />
    </>
  );
};
