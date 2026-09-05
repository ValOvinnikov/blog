import { EmailPageContent } from '@platform/components/features/email/email-page-content';
import { resolveDashboardTenant } from '@platform/server/auth/resolve-dashboard-tenant';
import {
  renderTenantScopedPage,
  tenantPageMetadata,
} from '@platform/server/tenant-pages/render-tenant-scoped-page';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return tenantPageMetadata('email');
}

export default async function DashboardEmailPage() {
  return renderTenantScopedPage(resolveDashboardTenant, EmailPageContent);
}
