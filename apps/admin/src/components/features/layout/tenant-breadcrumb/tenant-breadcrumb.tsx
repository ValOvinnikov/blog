'use client';

import {
  Breadcrumbs,
  type TBreadcrumbItem,
} from '@admin/components/shared/breadcrumbs';
import { usePathname } from '@admin/i18n/navigation';
import { adminRoutes } from '@admin/utils/routes/routes';
import { useTranslations } from 'next-intl';

export type TTenantBreadcrumbProps = {
  tenantId: string;
  tenantName: string;
};

/**
 * `tenants/[tenantId]/layout.tsx`'s breadcrumb — wraps the Look/Voice/
 * Features leaves; the tenant overview itself lives under a different
 * layout (`(platform)/tenants/[tenantId]/page.tsx`), so it's never the
 * current leaf here.
 */
export const TenantBreadcrumb = ({
  tenantId,
  tenantName,
}: TTenantBreadcrumbProps) => {
  const pathname = usePathname();
  const t = useTranslations('navSections');
  const tTopbar = useTranslations('topbar');

  const leafLabel = (() => {
    if (pathname === adminRoutes.look(tenantId)) {
      return t('look');
    }
    if (pathname === adminRoutes.voice(tenantId)) {
      return t('voice');
    }
    return t('features');
  })();

  const items: TBreadcrumbItem[] = [
    { label: t('platformLabel') },
    { label: t('tenants'), href: adminRoutes.tenants() },
    { label: tenantName, href: adminRoutes.tenantOverview(tenantId) },
    { label: leafLabel },
  ];

  return (
    <Breadcrumbs items={items} ariaLabel={tTopbar('breadcrumbAriaLabel')} />
  );
};
