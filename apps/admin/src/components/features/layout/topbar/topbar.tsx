import type { TSidebarNavSection } from '@admin/components/features/layout/sidebar';
import type { ReactNode } from 'react';

import { TopbarNavMenu } from './topbar-nav-menu';
import { topbarVariants } from './topbar-variants';

export type TTopbarProps = {
  /** e.g. "Platform" or "Tenant · acme". */
  crumb: string;
  /** e.g. "ADMIN" or "OWNER". */
  roleLabel: string;
  /** When provided, renders the compact mobile nav menu carrying these sections. */
  sections?: TSidebarNavSection[];
  /** e.g. the tenant switcher, folded into the mobile nav menu above its sections. */
  switcher?: ReactNode;
};

export const Topbar = ({
  crumb,
  roleLabel,
  sections,
  switcher,
}: TTopbarProps) => {
  const { root, crumb: crumbClass, role, roleDot } = topbarVariants();

  return (
    <header className={root()}>
      {sections && <TopbarNavMenu sections={sections} switcher={switcher} />}
      <p className={crumbClass()}>{crumb}</p>
      <span className={role()}>
        <span aria-hidden="true" className={roleDot()} />
        {roleLabel}
      </span>
    </header>
  );
};
