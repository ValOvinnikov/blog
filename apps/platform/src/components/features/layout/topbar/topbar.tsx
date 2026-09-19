import type { TSidebarNavSection } from '@platform/components/features/layout/sidebar';
import { Avatar } from '@platform/components/shared/avatar';
import type { ReactNode } from 'react';

import { TopbarNavMenu } from './topbar-nav-menu';
import { topbarVariants } from './topbar-variants';

export type TRoleChipProps = {
  name: string;
  role: string;
  scope: string;
};

export type TTopbarProps = {
  crumb: ReactNode;
  roleChip: TRoleChipProps;
  sections?: TSidebarNavSection[];
  switcher?: ReactNode;
};

export const Topbar = ({
  crumb,
  roleChip,
  sections,
  switcher,
}: TTopbarProps) => {
  const { root, role, roleDot, roleScope } = topbarVariants();

  return (
    <header className={root()}>
      {sections && <TopbarNavMenu sections={sections} switcher={switcher} />}
      {crumb}
      <span className={role()}>
        <Avatar name={roleChip.name} variant="chip" />
        <span aria-hidden="true" className={roleDot()} />
        {roleChip.role}
        <span className={roleScope()}>· {roleChip.scope}</span>
      </span>
    </header>
  );
};
