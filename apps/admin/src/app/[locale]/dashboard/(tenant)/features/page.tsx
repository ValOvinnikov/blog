import { FeaturesPageContent } from '@admin/components/features-page-content';
import { resolveDashboardTenant } from '@admin/server/auth/resolve-dashboard-tenant';
import {
  renderTenantScopedPage,
  tenantPageMetadata,
} from '@admin/server/tenant-pages/render-tenant-scoped-page';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return tenantPageMetadata('features');
}

export default async function DashboardFeaturesPage() {
  return renderTenantScopedPage(resolveDashboardTenant, FeaturesPageContent);
}
