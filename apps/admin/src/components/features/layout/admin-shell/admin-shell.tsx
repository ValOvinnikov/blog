import {
  Sidebar,
  type TSidebarNavSection,
} from '@admin/components/features/layout/sidebar';
import {
  Topbar,
  type TRoleChipProps,
} from '@admin/components/features/layout/topbar';
import type { ReactNode } from 'react';

import { adminShellVariants } from './admin-shell-variants';

export type TAdminShellProps = {
  sections: TSidebarNavSection[];
  switcher?: ReactNode;
  /** A rendered breadcrumb trail — see `@admin/components/shared/breadcrumbs`. */
  crumb: ReactNode;
  roleChip: TRoleChipProps;
  children: ReactNode;
};

/**
 * The persistent frame (sidebar + topbar) both the Platform and Tenant
 * layouts render around their gated pages. Carries no authorization logic
 * itself — each layout decides what `sections`/`roleChip` it's entitled to
 * show before this ever renders.
 */
export const AdminShell = ({
  sections,
  switcher,
  crumb,
  roleChip,
  children,
}: TAdminShellProps) => {
  const { root, main, content } = adminShellVariants();

  return (
    <div className={root()}>
      <Sidebar sections={sections} switcher={switcher} />
      <div className={main()}>
        <Topbar
          crumb={crumb}
          roleChip={roleChip}
          sections={sections}
          switcher={switcher}
        />
        <main className={content()}>{children}</main>
      </div>
    </div>
  );
};
