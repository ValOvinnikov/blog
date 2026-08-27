'use client';

import {
  Breadcrumbs,
  type TBreadcrumbItem,
} from '@admin/components/shared/breadcrumbs';
import { usePathname } from '@admin/i18n/navigation';
import { adminRoutes } from '@admin/utils/routes/routes';
import { useTranslations } from 'next-intl';

export type TPlatformBreadcrumbProps = {
  /** Present only on the `/tenants/{id}` overview and `/tenants/{id}/provisioning` routes this layout also wraps. */
  tenantId?: string;
  tenantName?: string;
};

/**
 * `(platform)/layout.tsx`'s breadcrumb — wraps four route shapes
 * (`/tenants`, `/add-tenant`, the `/tenants/{id}` overview, and
 * `/tenants/{id}/provisioning`) that a layout can't tell apart from `params`
 * alone (the last two share the same `tenantId` param), so the current leaf
 * is read from the pathname.
 */
export const PlatformBreadcrumb = ({
  tenantId,
  tenantName,
}: TPlatformBreadcrumbProps) => {
  const pathname = usePathname();
  const t = useTranslations('navSections');
  const tTopbar = useTranslations('topbar');
  const tBreadcrumb = useTranslations('platformBreadcrumb');

  const platform: TBreadcrumbItem = { label: t('platformLabel') };
  const tenants: TBreadcrumbItem = {
    label: t('tenants'),
    href: adminRoutes.tenants(),
  };

  const items: TBreadcrumbItem[] = (() => {
    if (tenantId && tenantName) {
      if (pathname === adminRoutes.tenantProvisioning(tenantId)) {
        return [
          platform,
          tenants,
          { label: tenantName, href: adminRoutes.tenantOverview(tenantId) },
          { label: tBreadcrumb('provisioningLabel') },
        ];
      }
      return [platform, tenants, { label: tenantName }];
    }
    if (pathname === adminRoutes.addTenant()) {
      return [platform, tenants, { label: t('addTenant') }];
    }
    return [platform, { label: t('tenants') }];
  })();

  return (
    <Breadcrumbs items={items} ariaLabel={tTopbar('breadcrumbAriaLabel')} />
  );
};
