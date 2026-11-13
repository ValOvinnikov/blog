import { LeadsPageContent } from '@platform/components/features/leads/leads-page-content';
import { resolveGatedDashboardTenant } from '@platform/server/auth/resolve-gated-dashboard-tenant';
import { pageMetadata } from '@platform/server/page-metadata/page-metadata';
import { renderTenantScopedPage } from '@platform/server/tenant-pages/render-tenant-scoped-page';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata('leads');
}

export default async function DashboardLeadsPage() {
  return renderTenantScopedPage(
    resolveGatedDashboardTenant('leads'),
    ({ tenant }) => LeadsPageContent({ tenant }),
  );
}
