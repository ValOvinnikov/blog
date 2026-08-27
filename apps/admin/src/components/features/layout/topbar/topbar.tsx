import type { TSidebarNavSection } from '@admin/components/features/layout/sidebar';
import { Avatar } from '@admin/components/shared/avatar';
import type { ReactNode } from 'react';

import { TopbarNavMenu } from './topbar-nav-menu';
import { topbarVariants } from './topbar-variants';

export type TRoleChipProps = {
  /** Used only to derive the avatar's initials — never rendered as text itself. */
  name: string;
  /** e.g. "SUPERADMIN" or "OWNER". */
  role: string;
  /** e.g. "Platform" or a tenant's name. */
  scope: string;
};

export type TTopbarProps = {
  /** A rendered breadcrumb trail — see `@admin/components/shared/breadcrumbs`. */
  crumb: ReactNode;
  roleChip: TRoleChipProps;
  /** When provided, renders the compact mobile nav menu carrying these sections. */
  sections?: TSidebarNavSection[];
  /** e.g. the tenant switcher, folded into the mobile nav menu above its sections. */
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
