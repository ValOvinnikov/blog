'use client';

import {
  Breadcrumbs,
  type TBreadcrumbItem,
} from '@platform/components/shared/breadcrumbs';
import { usePathname } from '@platform/i18n/navigation';
import {
  dashboardNavSections,
  EVERY_PLAN_PAGE,
  navLabelForPathname,
} from '@platform/utils/nav-sections/nav-sections';
import { adminRoutes } from '@platform/utils/routes/routes';
import { useTranslations } from 'next-intl';

/** Never names the tenant: this tree exists so an owner never sees that the platform is multi-tenant. */
export const DashboardBreadcrumb = () => {
  const pathname = usePathname();
  const t = useTranslations('navSections');
  const tDashboard = useTranslations('dashboardLayout');
  const tTopbar = useTranslations('topbar');

  const homeHref = adminRoutes.dashboard();
  const yourSite: TBreadcrumbItem = { label: tDashboard('yourSiteLabel') };

  if (pathname === homeHref) {
    return (
      <Breadcrumbs
        items={[yourSite]}
        ariaLabel={tTopbar('breadcrumbAriaLabel')}
      />
    );
  }

  const leafLabel = navLabelForPathname(
    dashboardNavSections(t, EVERY_PLAN_PAGE),
    pathname,
  );

  const items: TBreadcrumbItem[] = [
    { ...yourSite, href: homeHref },
    ...(leafLabel ? [{ label: leafLabel }] : []),
  ];

  return (
    <Breadcrumbs items={items} ariaLabel={tTopbar('breadcrumbAriaLabel')} />
  );
};
