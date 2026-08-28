'use client';

import {
  Breadcrumbs,
  type TBreadcrumbItem,
} from '@platform/components/shared/breadcrumbs';
import { usePathname } from '@platform/i18n/navigation';
import { adminRoutes } from '@platform/utils/routes/routes';
import { useTranslations } from 'next-intl';

/**
 * `(operator)/layout.tsx`'s breadcrumb — every route under that segment is
 * tenant-agnostic (`/tenants`, `/tenants/new`); a specific tenant's pages live
 * under `tenants/[tenantId]/layout.tsx`'s own `TenantBreadcrumb` instead.
 */
export const OperatorBreadcrumb = () => {
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
