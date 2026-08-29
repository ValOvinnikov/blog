import { StudioShell } from '@platform/components/shared/studio-shell';
import { resolveDashboardTenant } from '@platform/server/auth/resolve-dashboard-tenant';

type TProps = {
  children: React.ReactNode;
};

/**
 * Studio's bare, full-bleed counterpart to `(tenant)/layout.tsx` — same
 * `resolveDashboardTenant` narrowing (redirects to the picker when more than
 * one tenant is ambiguous), but no `AdminShell` chrome around it. The
 * resolved tenant itself is discarded here: `resolveDashboardTenant` is
 * `cache()`-wrapped, so the Studio page's own call for `projectId`/`dataset`
 * reuses this fetch rather than re-querying.
 */
export default async function DashboardStudioLayout({ children }: TProps) {
  await resolveDashboardTenant();

  return <StudioShell>{children}</StudioShell>;
}
