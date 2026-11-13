import { BillingPageContent } from '@platform/components/features/billing/billing-page-content';
import { resolveBillingPageTenant } from '@platform/server/billing/resolve-billing-page-tenant';
import { pageMetadata } from '@platform/server/page-metadata/page-metadata';
import { renderTenantScopedPage } from '@platform/server/tenant-pages/render-tenant-scoped-page';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata('billing');
}

export default async function DashboardBillingPage() {
  return renderTenantScopedPage(resolveBillingPageTenant, BillingPageContent);
}
