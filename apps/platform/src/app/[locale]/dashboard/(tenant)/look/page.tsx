import { LookPageContent } from '@platform/components/features/look/look-page-content';
import { resolveDashboardTenant } from '@platform/server/auth/resolve-dashboard-tenant';
import { pageMetadata } from '@platform/server/page-metadata/page-metadata';
import { renderTenantScopedPage } from '@platform/server/tenant-pages/render-tenant-scoped-page';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata('look');
}

export default async function DashboardLookPage() {
  return renderTenantScopedPage(resolveDashboardTenant, LookPageContent);
}
