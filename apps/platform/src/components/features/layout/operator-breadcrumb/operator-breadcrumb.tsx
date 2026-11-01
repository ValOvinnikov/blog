'use client';

import type { TAdminRole } from '@blog/db/constants';
import {
  Breadcrumbs,
  type TBreadcrumbItem,
} from '@platform/components/shared/breadcrumbs';
import { usePathname } from '@platform/i18n/navigation';
import {
  navLabelForPathname,
  operatorNavSections,
} from '@platform/utils/nav-sections/nav-sections';
import { adminRoutes } from '@platform/utils/routes/routes';
import { useTranslations } from 'next-intl';

export type TOperatorBreadcrumbProps = {
  role: TAdminRole;
};

export const OperatorBreadcrumb = ({ role }: TOperatorBreadcrumbProps) => {
  const pathname = usePathname();
  const t = useTranslations('navSections');
  const tTopbar = useTranslations('topbar');

  const isNewTenant = pathname === adminRoutes.newTenant();
  const leafLabel = isNewTenant
    ? t('addTenant')
    : navLabelForPathname(operatorNavSections(t, role), pathname);

  const items: TBreadcrumbItem[] = [
    { label: t('platformLabel') },
    ...(isNewTenant
      ? [{ label: t('tenants'), href: adminRoutes.tenants() }]
      : []),
    ...(leafLabel ? [{ label: leafLabel }] : []),
  ];

  return (
    <Breadcrumbs items={items} ariaLabel={tTopbar('breadcrumbAriaLabel')} />
  );
};
