import { AdminShell } from '@platform/components/features/layout/admin-shell';
import { OperatorBreadcrumb } from '@platform/components/features/layout/operator-breadcrumb';
import { requireAdmin } from '@platform/server/auth/require-admin';
import { loadAdminShellChrome } from '@platform/server/layout/load-admin-shell-chrome';
import { operatorNavSections } from '@platform/utils/nav-sections/nav-sections';

type TProps = {
  children: React.ReactNode;
};

/**
 * Gates page rendering for everything nested under this segment behind an
 * `admins` row (`requireAdmin`) — the Platform section, as opposed to a
 * tenant's own `memberships`-gated section. Route Handlers and Server Actions
 * placed under this segment are not covered by a layout and must call
 * `requireAdmin()` themselves.
 *
 * Its own directory path (`(operator)/layout.tsx`) has no dynamic segment —
 * `tenantId` belongs to routes several directories deeper — so it can't type
 * a `tenantId` param itself; `OperatorBreadcrumb` resolves that at runtime
 * instead via `useParams`.
 */
export default async function OperatorLayout({ children }: TProps) {
  const admin = await requireAdmin();
  const { isSidebarInitiallyCollapsed, tNavSections, userName } =
    await loadAdminShellChrome();

  return (
    <AdminShell
      isSidebarInitiallyCollapsed={isSidebarInitiallyCollapsed}
      sections={operatorNavSections(tNavSections)}
      crumb={<OperatorBreadcrumb />}
      roleChip={{
        name: userName,
        role: admin.role,
        scope: tNavSections('platformLabel'),
      }}
    >
      {children}
    </AdminShell>
  );
}
