import { DashboardStudioView } from '@platform/components/features/studio/dashboard-studio-view';
import { resolveDashboardTenant } from '@platform/server/auth/resolve-dashboard-tenant';
import { pageMetadata } from '@platform/server/page-metadata/page-metadata';
import { renderTenantScopedPage } from '@platform/server/tenant-pages/render-tenant-scoped-page';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata('studio');
}

export default async function DashboardStudioPage() {
  return renderTenantScopedPage(resolveDashboardTenant, DashboardStudioView);
}
