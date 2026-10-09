'use client';

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

export const OperatorBreadcrumb = () => {
  const pathname = usePathname();
  const t = useTranslations('navSections');
  const tTopbar = useTranslations('topbar');

  const leafLabel = navLabelForPathname(operatorNavSections(t), pathname);

  const items: TBreadcrumbItem[] = [
    { label: t('platformLabel') },
    ...(pathname === adminRoutes.newTenant()
      ? [{ label: t('tenants'), href: adminRoutes.tenants() }]
      : []),
    ...(leafLabel ? [{ label: leafLabel }] : []),
  ];

  return (
    <Breadcrumbs items={items} ariaLabel={tTopbar('breadcrumbAriaLabel')} />
  );
};
