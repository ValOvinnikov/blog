import type { TMaybeUndefined } from '@blog/config';
import type { TAdminRole, TMembershipRole } from '@blog/db/constants';
import { AccountMenu } from '@platform/components/features/layout/account-menu';
import {
  Sidebar,
  type TSidebarNavSection,
} from '@platform/components/features/layout/sidebar';
import { Topbar } from '@platform/components/features/layout/topbar';
import { ACCOUNT_MENU_APPEARANCE } from '@platform/constants/account-menu';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import { ShellFrame } from './components/shell-frame';

type TAdminShellAccount = {
  name: TMaybeUndefined<string>;
  email: TMaybeUndefined<string>;
  role: TAdminRole | TMembershipRole;
  scope: string;
};

export type TAdminShellProps = {
  sections: TSidebarNavSection[];
  switcher?: ReactNode;
  crumb: ReactNode;
  account: TAdminShellAccount;
  notice?: ReactNode;
  isSidebarInitiallyCollapsed?: boolean;
  children: ReactNode;
};

export const AdminShell = ({
  sections,
  switcher,
  crumb,
  account,
  notice,
  isSidebarInitiallyCollapsed = false,
  children,
}: TAdminShellProps) => {
  const t = useTranslations('account');
  const tRole = useTranslations('roleLabel');
  const { name, email, role, scope } = account;
  const shellAccount = {
    name,
    email,
    roleLine: t('roleLine', { role: tRole(role), scope }),
  };

  return (
    <ShellFrame
      isSidebarInitiallyCollapsed={isSidebarInitiallyCollapsed}
      sidebar={
        <Sidebar
          sections={sections}
          switcher={switcher}
          foot={
            <AccountMenu
              account={shellAccount}
              appearance={ACCOUNT_MENU_APPEARANCE.SIDEBAR}
            />
          }
        />
      }
      topbar={
        <Topbar
          crumb={crumb}
          account={shellAccount}
          sections={sections}
          switcher={switcher}
        />
      }
      notice={notice}
    >
      {children}
    </ShellFrame>
  );
};
