import {
  Sidebar,
  type TSidebarNavSection,
} from '@platform/components/features/layout/sidebar';
import {
  Topbar,
  type TRoleChipProps,
} from '@platform/components/features/layout/topbar';
import type { ReactNode } from 'react';

import { ShellFrame } from './components/shell-frame';

export type TAdminShellProps = {
  sections: TSidebarNavSection[];
  switcher?: ReactNode;
  crumb: ReactNode;
  roleChip: TRoleChipProps;
  isSidebarInitiallyCollapsed?: boolean;
  children: ReactNode;
};

export const AdminShell = ({
  sections,
  switcher,
  crumb,
  roleChip,
  isSidebarInitiallyCollapsed = false,
  children,
}: TAdminShellProps) => {
  return (
    <ShellFrame
      isSidebarInitiallyCollapsed={isSidebarInitiallyCollapsed}
      sidebar={<Sidebar sections={sections} switcher={switcher} />}
      topbar={
        <Topbar
          crumb={crumb}
          roleChip={roleChip}
          sections={sections}
          switcher={switcher}
        />
      }
    >
      {children}
    </ShellFrame>
  );
};
