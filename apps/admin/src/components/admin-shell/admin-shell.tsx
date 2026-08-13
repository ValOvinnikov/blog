import { Sidebar, type TSidebarNavSection } from '@admin/components/sidebar';
import { Topbar } from '@admin/components/topbar';
import type { ReactNode } from 'react';

import { adminShellVariants } from './admin-shell-variants';

export type TAdminShellProps = {
  sections: TSidebarNavSection[];
  switcher?: ReactNode;
  crumb: string;
  roleLabel: string;
  children: ReactNode;
};

/**
 * The persistent frame (sidebar + topbar) both the Platform and Tenant
 * layouts render around their gated pages. Carries no authorization logic
 * itself — each layout decides what `sections`/`roleLabel` it's entitled to
 * show before this ever renders.
 */
export function AdminShell({
  sections,
  switcher,
  crumb,
  roleLabel,
  children,
}: TAdminShellProps) {
  const { root, main, content } = adminShellVariants();

  return (
    <div className={root()}>
      <Sidebar sections={sections} switcher={switcher} />
      <div className={main()}>
        <Topbar crumb={crumb} roleLabel={roleLabel} />
        <main className={content()}>{children}</main>
      </div>
    </div>
  );
}
