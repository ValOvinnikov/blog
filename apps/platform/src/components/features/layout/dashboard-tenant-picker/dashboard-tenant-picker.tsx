import type { TTenant } from '@blog/db/schema/tenants';
import { TenantSwitcher } from '@platform/components/features/layout/tenant-switcher';
import { Heading } from '@platform/components/shared/heading';
import { Text } from '@platform/components/shared/text';
import { toTenantSwitcherItems } from '@platform/utils/tenant-switcher-items/tenant-switcher-items';
import { useTranslations } from 'next-intl';

import { dashboardTenantPickerVariants } from './dashboard-tenant-picker-variants';

export type TDashboardTenantPickerProps = {
  tenants: TTenant[];
};

export const DashboardTenantPicker = ({
  tenants,
}: TDashboardTenantPickerProps) => {
  const t = useTranslations('dashboardTenantPicker');

  const [firstTenant] = tenants;

  if (!firstTenant) {
    return null;
  }

  return (
    <div className={dashboardTenantPickerVariants()}>
      <Heading level={1} size="pageTitle">
        {t('heading')}
      </Heading>
      <Text variant="supporting">{t('description')}</Text>
      <TenantSwitcher
        tenants={toTenantSwitcherItems(tenants)}
        activeTenantId={firstTenant.id}
      />
    </div>
  );
};
