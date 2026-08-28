'use client';

import {
  Breadcrumbs,
  type TBreadcrumbItem,
} from '@platform/components/shared/breadcrumbs';
import { usePathname } from '@platform/i18n/navigation';
import { adminRoutes } from '@platform/utils/routes/routes';
import { useTranslations } from 'next-intl';

export type TTenantBreadcrumbProps = {
  tenantId: string;
  tenantName: string;
};

/**
 * `tenants/[tenantId]/layout.tsx`'s breadcrumb — wraps every page under it:
 * the overview itself (tenant name is the current leaf, with no href), and
 * Look/Voice/Features/Domain/Provisioning/Danger zone (an extra leaf beyond
 * the linked tenant name).
 */
export const TenantBreadcrumb = ({
  tenantId,
  tenantName,
}: TTenantBreadcrumbProps) => {
  const pathname = usePathname();
  const t = useTranslations('navSections');
  const tTopbar = useTranslations('topbar');

  const isOverview = pathname === adminRoutes.tenantOverview(tenantId);

  const leafLabel = (() => {
    if (pathname === adminRoutes.look(tenantId)) {
      return t('look');
    }
    if (pathname === adminRoutes.voice(tenantId)) {
      return t('voice');
    }
    if (pathname === adminRoutes.tenantDomain(tenantId)) {
      return t('domain');
    }
    if (pathname === adminRoutes.tenantProvisioning(tenantId)) {
      return t('provisioning');
    }
    if (pathname === adminRoutes.tenantDanger(tenantId)) {
      return t('dangerZone');
    }
    return t('features');
  })();

  const items: TBreadcrumbItem[] = [
    { label: t('platformLabel') },
    { label: t('tenants'), href: adminRoutes.tenants() },
    isOverview
      ? { label: tenantName }
      : { label: tenantName, href: adminRoutes.tenantOverview(tenantId) },
    ...(isOverview ? [] : [{ label: leafLabel }]),
  ];

  return (
    <Breadcrumbs items={items} ariaLabel={tTopbar('breadcrumbAriaLabel')} />
  );
};
