import { LanguagesPageContent } from '@platform/components/features/languages/languages-page-content';
import { resolveDashboardTenant } from '@platform/server/auth/resolve-dashboard-tenant';
import {
  renderTenantScopedPage,
  tenantPageMetadata,
} from '@platform/server/tenant-pages/render-tenant-scoped-page';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return tenantPageMetadata('languages');
}

export default async function DashboardLanguagesPage() {
  return renderTenantScopedPage(resolveDashboardTenant, LanguagesPageContent);
}
