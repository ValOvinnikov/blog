'use client';

import {
  Breadcrumbs,
  type TBreadcrumbItem,
} from '@admin/components/shared/breadcrumbs';
import { usePathname } from '@admin/i18n/navigation';
import { adminRoutes } from '@admin/utils/routes/routes';
import { useTranslations } from 'next-intl';

/**
 * `(platform)/layout.tsx`'s breadcrumb — every route under that segment is
 * tenant-agnostic (`/tenants`, `/tenants/new`); a specific tenant's pages live
 * under `tenants/[tenantId]/layout.tsx`'s own `TenantBreadcrumb` instead.
 */
export const PlatformBreadcrumb = () => {
  const pathname = usePathname();
  const t = useTranslations('navSections');
  const tTopbar = useTranslations('topbar');

  const platform: TBreadcrumbItem = { label: t('platformLabel') };
  const tenants: TBreadcrumbItem = {
    label: t('tenants'),
    href: adminRoutes.tenants(),
  };

  const items: TBreadcrumbItem[] =
    pathname === adminRoutes.newTenant()
      ? [platform, tenants, { label: t('addTenant') }]
      : [platform, { label: t('tenants') }];

  return (
    <Breadcrumbs items={items} ariaLabel={tTopbar('breadcrumbAriaLabel')} />
  );
};
