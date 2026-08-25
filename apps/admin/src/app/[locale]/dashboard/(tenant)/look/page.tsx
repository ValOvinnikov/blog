import { LookPageContent } from '@admin/components/look-page-content';
import { resolveDashboardTenant } from '@admin/server/auth/resolve-dashboard-tenant';
import {
  renderTenantScopedPage,
  tenantPageMetadata,
} from '@admin/server/tenant-pages/render-tenant-scoped-page';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return tenantPageMetadata('look');
}

export default async function DashboardLookPage() {
  return renderTenantScopedPage(resolveDashboardTenant, LookPageContent);
}
