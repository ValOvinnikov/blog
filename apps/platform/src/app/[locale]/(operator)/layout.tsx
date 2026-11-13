import { OperatorBreadcrumb } from '@platform/components/features/layout/operator-breadcrumb';
import { PlatformShell } from '@platform/components/features/layout/platform-shell';
import { ContrastDueBanner } from '@platform/components/features/releases/contrast-due-banner';
import { isSuperAdmin } from '@platform/server/auth/is-super-admin';
import { requireAdmin } from '@platform/server/auth/require-admin';
import { loadPlatformShellChrome } from '@platform/server/layout/load-platform-shell-chrome';
import { operatorNavSections } from '@platform/utils/nav-sections/nav-sections';
import { Suspense } from 'react';

type TProps = {
  children: React.ReactNode;
};

// A layout gates pages only: Route Handlers and Server Actions under this segment must call `requireAdmin()` themselves.
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
      notice={
        isSuperAdmin(admin) && (
          <Suspense fallback={null}>
            <ContrastDueBanner />
          </Suspense>
        )
      }
    >
      {children}
    </PlatformShell>
  );
}
