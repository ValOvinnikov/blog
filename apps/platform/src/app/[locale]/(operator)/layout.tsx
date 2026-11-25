import { OperatorBreadcrumb } from '@platform/components/features/layout/operator-breadcrumb';
import { PlatformShell } from '@platform/components/features/layout/platform-shell';
import { requireAdmin } from '@platform/server/auth/require-admin';
import { loadPlatformShellChrome } from '@platform/server/layout/load-platform-shell-chrome';
import { operatorNavSections } from '@platform/utils/nav-sections/nav-sections';

type TProps = {
  children: React.ReactNode;
};

// Client-side navigation keeps this layout without re-running it, so every page, Route Handler and Server Action under this segment calls its own gate.
export default async function OperatorLayout({ children }: TProps) {
  const admin = await requireAdmin();
  const { isSidebarInitiallyCollapsed, tNavSections, userName, userEmail } =
    await loadPlatformShellChrome();

  return (
    <PlatformShell
      isSidebarInitiallyCollapsed={isSidebarInitiallyCollapsed}
      sections={operatorNavSections(tNavSections, admin.role)}
      crumb={<OperatorBreadcrumb role={admin.role} />}
      account={{
        name: userName,
        email: userEmail,
        role: admin.role,
        scope: tNavSections('platformLabel'),
      }}
    >
      {children}
    </PlatformShell>
  );
}
