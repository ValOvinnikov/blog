import { BillingPageContent } from '@platform/components/features/billing/billing-page-content';
import { resolveGatedDashboardTenant } from '@platform/server/auth/resolve-gated-dashboard-tenant';
import { pageMetadata } from '@platform/server/page-metadata/page-metadata';
import { renderTenantScopedPage } from '@platform/server/tenant-pages/render-tenant-scoped-page';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata('billing');
}

export default async function DashboardBillingPage() {
  return renderTenantScopedPage(
    resolveGatedDashboardTenant('billing'),
    BillingPageContent,
  );
}
