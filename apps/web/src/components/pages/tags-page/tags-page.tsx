import { routes, TAXONOMY_KIND } from '@blog/config';
import { service } from '@blog/service';
import type { IBreadcrumbItem } from '@blog/ui/molecules/breadcrumbs';
import { TaxonomyListModule } from '@web/modules/taxonomy-list/taxonomy-list-module';
import { buildBreadcrumbListSchema } from '@web/utils/build-breadcrumb-list-schema';
import { env } from '@web/utils/env/env';
import { logger } from '@web/utils/logger/logger';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { TagsPageView } from './tags-page-view';

/**
 * TagsPage — `/tags` composition: fetches the `page_tagIndex` document via
 * `service.pages.tagIndex.v1.getIndexPage()`, then hands the resolved data —
 * plus the pre-rendered `taxonomyList` slot content — to `TagsPageView`.
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
  const breadcrumbTrail: IBreadcrumbItem[] = [
    { label: breadcrumbsT('home'), href: routes.home() },
    { label: breadcrumbsT('tags'), href: routes.tags() },
  ];
  const breadcrumbListSchema = buildBreadcrumbListSchema(
    breadcrumbTrail,
    siteUrl,
  );

  return (
    <TagsPageView
      heading={heading}
      supportingText={supportingText}
      breadcrumbTrail={breadcrumbTrail}
      breadcrumbAriaLabel={breadcrumbsT('ariaLabel')}
      breadcrumbListSchema={breadcrumbListSchema}
      taxonomyListContent={
        <TaxonomyListModule
          id={taxonomyListId}
          taxonomy={TAXONOMY_KIND.TAGS}
          titleId="tag-list-title"
          dataTestId={`taxonomy-list-module-${taxonomyListId}`}
          headingLevel={2}
          accessibleTitle={heading}
          emptyMessage={t('empty')}
          buildHref={(slug) => routes.tag(slug)}
          formatPostCount={(count) => t('postsCount', { count })}
        />
      }
    />
  );
};
