'use client';

import {
  Breadcrumbs,
  type TBreadcrumbItem,
} from '@platform/components/shared/breadcrumbs';
import { usePathname } from '@platform/i18n/navigation';
import { adminRoutes } from '@platform/utils/routes/routes';
import { useTranslations } from 'next-intl';

/**
 * `dashboard/(tenant)/layout.tsx`'s breadcrumb — the owner tree's
 * counterpart to `TenantBreadcrumb`. Deliberately never names the tenant:
 * this tree exists so an owner never sees that the platform is multi-tenant.
 */
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

  const leafLabel = (() => {
    if (pathname === adminRoutes.dashboardLook()) {
      return t('look');
    }
    if (pathname === adminRoutes.dashboardVoice()) {
      return t('voice');
    }
    return t('features');
  })();

  const items: TBreadcrumbItem[] = [
    { ...yourSite, href: homeHref },
    { label: leafLabel },
  ];

  return (
    <Breadcrumbs items={items} ariaLabel={tTopbar('breadcrumbAriaLabel')} />
  );
};
