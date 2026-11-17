import { HelpPageContent } from '@platform/components/features/support/help-page-content';
import { resolveDashboardTenant } from '@platform/server/auth/resolve-dashboard-tenant';
import { pageMetadata } from '@platform/server/page-metadata/page-metadata';
import { renderTenantScopedPage } from '@platform/server/tenant-pages/render-tenant-scoped-page';
import { adminRoutes } from '@platform/utils/routes/routes';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata('help');
}

export default async function DashboardHelpPage() {
  return renderTenantScopedPage(resolveDashboardTenant, ({ tenant }) =>
    HelpPageContent({ tenant, helpPath: adminRoutes.dashboardHelp() }),
  );
}
