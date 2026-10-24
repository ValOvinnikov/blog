import { LeadsPageContent } from '@platform/components/features/leads/leads-page-content';
import { resolveLeadsPageTenant } from '@platform/server/leads/resolve-leads-page-tenant';
import { pageMetadata } from '@platform/server/page-metadata/page-metadata';
import { renderTenantScopedPage } from '@platform/server/tenant-pages/render-tenant-scoped-page';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata('leads');
}

export default async function DashboardLeadsPage() {
  return renderTenantScopedPage(resolveLeadsPageTenant, ({ tenant }) =>
    LeadsPageContent({ tenant }),
  );
}
