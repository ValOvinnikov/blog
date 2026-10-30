import { RailBrand } from '@platform/components/features/layout/rail-brand';
import { RailIntro } from '@platform/components/features/layout/rail-intro';
import { SignedInAccount } from '@platform/components/features/layout/signed-in-account';
import type { TTenantPickerItem } from '@platform/server/tenants/to-tenant-picker-items';
import { useTranslations } from 'next-intl';

import { TenantPickerPane } from './components/tenant-picker-pane';
import { dashboardTenantPickerVariants } from './dashboard-tenant-picker-variants';

export type TDashboardTenantPickerProps = {
  tenants: TTenantPickerItem[];
  accountEmail?: string;
};

export const DashboardTenantPicker = ({
  tenants,
  accountEmail,
}: TDashboardTenantPickerProps) => {
  const t = useTranslations('dashboardTenantPicker');
  const { root, rail, account, accountRule } = dashboardTenantPickerVariants();

  if (tenants.length === 0) {
    return null;
  }

  return (
    <div className={root()}>
      <header className={rail()}>
        <RailBrand />
        <RailIntro
          title={t('heading')}
          description={t('description')}
          isPageHeading={true}
        />
      </header>
      <TenantPickerPane tenants={tenants} />
      {accountEmail && (
        <footer className={account()}>
          <div className={accountRule()}>
            <SignedInAccount email={accountEmail} surface="railFooter" />
          </div>
        </footer>
      )}
    </div>
  );
};
