'use client';

import {
  Breadcrumbs,
  type TBreadcrumbItem,
} from '@platform/components/shared/breadcrumbs';
import { usePathname } from '@platform/i18n/navigation';
import {
  navLabelForPathname,
  tenantNavSections,
} from '@platform/utils/nav-sections/nav-sections';
import { EVERY_PLAN_PAGE } from '@platform/utils/plan-page-access/plan-page-access';
import { adminRoutes } from '@platform/utils/routes/routes';
import { useTranslations } from 'next-intl';

export type TTenantBreadcrumbProps = {
  tenantId: string;
  tenantName: string;
};

export const TenantBreadcrumb = ({
  tenantId,
  tenantName,
}: TTenantBreadcrumbProps) => {
  const pathname = usePathname();
  const t = useTranslations('navSections');
  const tTopbar = useTranslations('topbar');

  const isOverview = pathname === adminRoutes.tenantOverview(tenantId);
  const leafLabel = isOverview
    ? undefined
    : navLabelForPathname(
        tenantNavSections(t, tenantId, tenantName, EVERY_PLAN_PAGE),
        pathname,
      );

  const items: TBreadcrumbItem[] = [
    { label: t('platformLabel') },
    { label: t('tenants'), href: adminRoutes.tenants() },
    {
      label: tenantName,
      href: adminRoutes.tenantOverview(tenantId),
      isShrinkable: true,
    },
    ...(leafLabel ? [{ label: leafLabel }] : []),
  ];

  return (
    <Breadcrumbs items={items} ariaLabel={tTopbar('breadcrumbAriaLabel')} />
  );
};
