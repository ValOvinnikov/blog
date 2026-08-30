import { routes, type ILocalizedParams } from '@blog/config';
import { service } from '@blog/service';
import type { IBreadcrumbItem } from '@blog/ui/molecules/breadcrumbs';
import { ModuleRenderer } from '@web/modules/module-renderer';
import { buildBreadcrumbListSchema } from '@web/utils/build-breadcrumb-list-schema';
import { env } from '@web/utils/env/env';
import { guardPageLoaderResult } from '@web/utils/guard-page-loader-result';
import { getTranslations } from 'next-intl/server';

import { GenericPageView } from './generic-page-view';

type TGenericPageProps = ILocalizedParams & { slug: string };

/**
 * GenericPage — `/{slug}` composition for standalone `page_generic`
 * documents: fetches the page via `service.pages.generic.v1.getPage`, then
 * hands the resolved data — plus the pre-rendered `modules[]` content — to
 * `GenericPageView`.
 */
export const GenericPage = async ({ slug, locale }: TGenericPageProps) => {
  const [result, breadcrumbsT] = await Promise.all([
    service.pages.generic.v1.getPage(slug),
    getTranslations('breadcrumbs'),
  ]);

  const { title, modules } = guardPageLoaderResult(
    result,
    'generic_page.fetch_failed',
    { slug },
  );

  const siteUrl = env.NEXT_PUBLIC_SITE_URL ?? '';
  const breadcrumbTrail: IBreadcrumbItem[] = [
    { label: breadcrumbsT('home'), href: routes.home() },
    { label: title, href: routes.genericPage(slug) },
  ];
  const breadcrumbListSchema = buildBreadcrumbListSchema(
    breadcrumbTrail,
    siteUrl,
  );

  return (
    <GenericPageView
      title={title}
      breadcrumbTrail={breadcrumbTrail}
      breadcrumbAriaLabel={breadcrumbsT('ariaLabel')}
      breadcrumbListSchema={breadcrumbListSchema}
      modulesContent={<ModuleRenderer modules={modules} locale={locale} />}
    />
  );
};
