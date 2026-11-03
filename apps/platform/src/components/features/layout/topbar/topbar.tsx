'use client';

import {
  AccountMenu,
  type TAccount,
} from '@platform/components/features/layout/account-menu';
import type { TSidebarNavSection } from '@platform/components/features/layout/sidebar';
import { useRef, type ReactNode } from 'react';

import { SidebarCollapseToggle } from './components/sidebar-collapse-toggle';
import { TopbarNavMenu } from './components/topbar-nav-menu';
import { topbarVariants } from './topbar-variants';

export type TTopbarProps = {
  crumb: ReactNode;
  account: TAccount;
  sections: TSidebarNavSection[];
  switcher?: ReactNode;
};

export const Topbar = ({
  crumb,
  account,
  sections,
  switcher,
}: TTopbarProps) => {
  const { root } = topbarVariants();
  const barRef = useRef<HTMLElement>(null);

  return (
    <header ref={barRef} className={root()}>
      <SidebarCollapseToggle />
      <TopbarNavMenu
        sections={sections}
        switcher={switcher}
        account={<AccountMenu account={account} />}
        barRef={barRef}
      />
      {crumb}
    </header>
  );
};
