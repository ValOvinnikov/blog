import { SignInAppsPageContent } from '@platform/components/features/sign-in-apps/sign-in-apps-page-content';
import { resolveDashboardTenant } from '@platform/server/auth/resolve-dashboard-tenant';
import { pageMetadata } from '@platform/server/page-metadata/page-metadata';
import { renderTenantScopedPage } from '@platform/server/tenant-pages/render-tenant-scoped-page';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata('signInApps');
}

export default async function DashboardSignInAppsPage() {
  return renderTenantScopedPage(resolveDashboardTenant, SignInAppsPageContent);
}
