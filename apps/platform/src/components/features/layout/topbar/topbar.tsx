import {
  AccountMenu,
  type TAccount,
} from '@platform/components/features/layout/account-menu';
import type { TSidebarNavSection } from '@platform/components/features/layout/sidebar';
import { ACCOUNT_MENU_APPEARANCE } from '@platform/constants/account-menu';
import type { ReactNode } from 'react';

import { SidebarCollapseToggle } from './components/sidebar-collapse-toggle';
import { TopbarNavMenu } from './components/topbar-nav-menu';
import { topbarVariants } from './topbar-variants';

export type TTopbarProps = {
  crumb: ReactNode;
  account: TAccount;
  sections?: TSidebarNavSection[];
  switcher?: ReactNode;
};

export const Topbar = ({
  crumb,
  account,
  sections,
  switcher,
}: TTopbarProps) => {
  const { root } = topbarVariants();

  return (
    <header className={root()}>
      <SidebarCollapseToggle />
      {sections && <TopbarNavMenu sections={sections} switcher={switcher} />}
      {crumb}
      <AccountMenu
        account={account}
        appearance={ACCOUNT_MENU_APPEARANCE.PILL}
      />
    </header>
  );
};
