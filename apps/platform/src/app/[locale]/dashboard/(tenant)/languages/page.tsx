import { LanguagesPageContent } from '@platform/components/features/languages/languages-page-content';
import { resolveDashboardTenant } from '@platform/server/auth/resolve-dashboard-tenant';
import { pageMetadata } from '@platform/server/page-metadata/page-metadata';
import { renderTenantScopedPage } from '@platform/server/tenant-pages/render-tenant-scoped-page';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata('languages');
}

export default async function DashboardLanguagesPage() {
  return renderTenantScopedPage(
    resolveDashboardTenant,
    LanguagesPageContent,
    'languages',
  );
}
