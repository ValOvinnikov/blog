import { StandaloneNotFoundPage } from '@web/components/pages/standalone-not-found-page';
import { buildNotFoundMetadata } from '@web/metadata/not-found-metadata';
import { getRememberedTenantId } from '@web/server/tenant/remembered-tenant';
import type { Metadata } from 'next';

/**
 * Catches a `notFound()` thrown by `[tenant]/[locale]/layout.tsx` itself
 * (e.g. a missing `settings_site`, an invalid locale), reading the tenant
 * the layout remembered before it threw rather than the request header.
 */
export async function generateMetadata(): Promise<Metadata> {
  return buildNotFoundMetadata();
}

export default async function TenantNotFound() {
  return await StandaloneNotFoundPage({ tenant: getRememberedTenantId() });
}
