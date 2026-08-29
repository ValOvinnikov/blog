import {
  Sidebar,
  type TSidebarNavSection,
} from '@platform/components/features/layout/sidebar';
import {
  Topbar,
  type TRoleChipProps,
} from '@platform/components/features/layout/topbar';
import type { ReactNode } from 'react';

import { ShellFrame } from './components/shell-frame/shell-frame';

export type TAdminShellProps = {
  sections: TSidebarNavSection[];
  switcher?: ReactNode;
  /** A rendered breadcrumb trail — see `@platform/components/shared/breadcrumbs`. */
  crumb: ReactNode;
  roleChip: TRoleChipProps;
  children: ReactNode;
};

/**
 * The persistent frame (sidebar + topbar) both the Platform and Tenant
 * layouts render around their gated pages. Carries no authorization logic
 * itself — each layout decides what `sections`/`roleChip` it's entitled to
 * show before this ever renders. `ShellFrame` decides the content column's
 * padded-vs-full-bleed mode from the active route segment.
 */
export const AdminShell = ({
  sections,
  switcher,
  crumb,
  roleChip,
  children,
}: TAdminShellProps) => {
  return (
    <ShellFrame
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
