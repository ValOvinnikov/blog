import { DomainPageContent } from '@platform/components/features/tenants/domain-page-content';
import { resolveDashboardTenant } from '@platform/server/auth/resolve-dashboard-tenant';
import { pageMetadata } from '@platform/server/page-metadata/page-metadata';
import { renderTenantScopedPage } from '@platform/server/tenant-pages/render-tenant-scoped-page';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata('tenantDomain');
}

export default async function DashboardDomainPage() {
  return renderTenantScopedPage(resolveDashboardTenant, DomainPageContent);
}
