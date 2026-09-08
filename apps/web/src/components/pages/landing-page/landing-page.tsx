import { routes, type ITenantLocalizedParams } from '@blog/config';
import { service } from '@blog/service';
import type { IBreadcrumbItem } from '@blog/ui/molecules/breadcrumbs';
import { HeroSlot } from '@web/modules/hero-slot';
import { ModuleRenderer } from '@web/modules/module-renderer';
import { getTenantBaseUrl } from '@web/server/tenant/get-tenant-base-url';
import { getTenantSanityContext } from '@web/server/tenant/get-tenant-sanity-context';
import { buildBreadcrumbListSchema } from '@web/utils/build-breadcrumb-list-schema';
import { guardPageLoaderResult } from '@web/utils/guard-page-loader-result';
import { getTranslations } from 'next-intl/server';

import { LandingPageView } from './landing-page-view';

type TLandingPageProps = ITenantLocalizedParams & { slug: string };

/**
 * LandingPage — `/{slug}` composition for standalone `page_landing`
 * documents: fetches the page via `service.pages.landing.v1.getPage`, then
 * hands the resolved data — plus the pre-rendered `modules[]` content — to
 * `LandingPageView`.
 */
export const LandingPage = async ({
  slug,
  locale,
  tenant,
}: TLandingPageProps) => {
  const tenantContext = await getTenantSanityContext(tenant);
  const [result, breadcrumbsT] = await Promise.all([
    service.pages.landing.v1.getPage(slug, tenantContext),
    getTranslations('breadcrumbs'),
  ]);

  const { title, hero, modules } = guardPageLoaderResult(
    result,
    'landing_page.fetch_failed',
    { slug },
  );

  const siteUrl = (await getTenantBaseUrl(tenant)) ?? '';
  const breadcrumbTrail: IBreadcrumbItem[] = [
    { label: breadcrumbsT('home'), href: routes.home() },
    { label: title, href: routes.landingPage(slug) },
  ];
  const breadcrumbListSchema = buildBreadcrumbListSchema(
    breadcrumbTrail,
    siteUrl,
  );

  return (
    <LandingPageView
      title={title}
      breadcrumbTrail={breadcrumbTrail}
      breadcrumbAriaLabel={breadcrumbsT('ariaLabel')}
      breadcrumbListSchema={breadcrumbListSchema}
      hero={
        hero && (
          <HeroSlot
            id={hero.id}
            type={hero.type}
            locale={locale}
            tenant={tenant}
          />
        )
      }
      modulesContent={
        <ModuleRenderer modules={modules} locale={locale} tenant={tenant} />
      }
    />
  );
};
