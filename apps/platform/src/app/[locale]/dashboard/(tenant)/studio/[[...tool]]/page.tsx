import { StudioMountView } from '@platform/components/features/studio/studio-mount-view';
import { resolveDashboardTenant } from '@platform/server/auth/resolve-dashboard-tenant';
import { pageMetadata } from '@platform/server/page-metadata/page-metadata';
import { renderTenantScopedPage } from '@platform/server/tenant-pages/render-tenant-scoped-page';
import { adminRoutes } from '@platform/utils/routes/routes';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata('studio');
}

export default async function DashboardStudioPage() {
  return renderTenantScopedPage(resolveDashboardTenant, ({ tenant }) =>
    StudioMountView({ tenant, basePath: adminRoutes.dashboardStudio() }),
  );
}
