import { TeamPageContent } from '@platform/components/features/team/team-page-content';
import { resolveGatedDashboardTenant } from '@platform/server/auth/resolve-gated-dashboard-tenant';
import { pageMetadata } from '@platform/server/page-metadata/page-metadata';
import { renderTenantScopedPage } from '@platform/server/tenant-pages/render-tenant-scoped-page';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata('team');
}

export default async function DashboardTeamPage() {
  return renderTenantScopedPage(
    resolveGatedDashboardTenant('team'),
    ({ tenant, viewer, membership }) =>
      TeamPageContent({ tenant, viewer, currentUserId: membership.userId }),
  );
}
