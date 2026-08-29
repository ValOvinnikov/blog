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
 * Look/Voice/Features/Domain/Studio/Provisioning/Danger zone (an extra leaf
 * beyond the linked tenant name). A route with no entry in
 * `leafLabelKeyByPathname` omits the leaf entirely rather than guessing a
 * label — add the route there when adding its page.
 */
export const TenantBreadcrumb = ({
  tenantId,
  tenantName,
}: TTenantBreadcrumbProps) => {
  const pathname = usePathname();
  const t = useTranslations('navSections');
  const tTopbar = useTranslations('topbar');

  const isOverview = pathname === adminRoutes.tenantOverview(tenantId);

  const leafLabelKeyByPathname: Record<string, string> = {
    [adminRoutes.look(tenantId)]: 'look',
    [adminRoutes.voice(tenantId)]: 'voice',
    [adminRoutes.features(tenantId)]: 'features',
    [adminRoutes.tenantDomain(tenantId)]: 'domain',
    [adminRoutes.tenantStudio(tenantId)]: 'studio',
    [adminRoutes.tenantProvisioning(tenantId)]: 'provisioning',
    [adminRoutes.tenantDanger(tenantId)]: 'dangerZone',
  };
  const leafLabelKey = leafLabelKeyByPathname[pathname];

  const items: TBreadcrumbItem[] = [
    { label: t('platformLabel') },
    { label: t('tenants'), href: adminRoutes.tenants() },
    isOverview
      ? { label: tenantName }
      : { label: tenantName, href: adminRoutes.tenantOverview(tenantId) },
    ...(leafLabelKey ? [{ label: t(leafLabelKey) }] : []),
  ];

  return (
    <Breadcrumbs items={items} ariaLabel={tTopbar('breadcrumbAriaLabel')} />
  );
};
