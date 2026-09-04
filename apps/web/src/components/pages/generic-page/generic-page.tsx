import { routes, type ITenantLocalizedParams } from '@blog/config';
import { service } from '@blog/service';
import type { IBreadcrumbItem } from '@blog/ui/molecules/breadcrumbs';
import { ModuleRenderer } from '@web/modules/module-renderer';
import { getTenantBaseUrl } from '@web/server/tenant/get-tenant-base-url';
import { getTenantSanityContext } from '@web/server/tenant/get-tenant-sanity-context';
import { buildBreadcrumbListSchema } from '@web/utils/build-breadcrumb-list-schema';
import { guardPageLoaderResult } from '@web/utils/guard-page-loader-result';
import { getTranslations } from 'next-intl/server';

import { GenericPageView } from './generic-page-view';

type TGenericPageProps = ITenantLocalizedParams & { slug: string };

/**
 * GenericPage — `/{slug}` composition for standalone `page_generic`
 * documents: fetches the page via `service.pages.generic.v1.getPage`, then
 * hands the resolved data — plus the pre-rendered `modules[]` content — to
 * `GenericPageView`.
 */
export const GenericPage = async ({
  slug,
  locale,
  tenant,
}: TGenericPageProps) => {
  const tenantContext = await getTenantSanityContext(tenant);
  const [result, breadcrumbsT] = await Promise.all([
    service.pages.generic.v1.getPage(slug, tenantContext),
    getTranslations('breadcrumbs'),
  ]);

  const { title, modules } = guardPageLoaderResult(
    result,
    'generic_page.fetch_failed',
    { slug },
  );

  const siteUrl = (await getTenantBaseUrl(tenant)) ?? '';
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
      modulesContent={
        <ModuleRenderer modules={modules} locale={locale} tenant={tenant} />
      }
    />
  );
};
