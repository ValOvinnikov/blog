import { DomainPageContent } from '@platform/components/features/tenants/domain-page-content';
import { resolveDashboardTenant } from '@platform/server/auth/resolve-dashboard-tenant';
import {
  renderTenantScopedPage,
  tenantPageMetadata,
} from '@platform/server/tenant-pages/render-tenant-scoped-page';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return tenantPageMetadata('tenantDomain');
}

export default async function DashboardDomainPage() {
  return renderTenantScopedPage(resolveDashboardTenant, DomainPageContent);
}
