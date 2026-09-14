import { StandaloneNotFoundPage } from '@web/components/pages/standalone-not-found-page';
import { buildNotFoundMetadata } from '@web/metadata/not-found-metadata';
import { getRememberedTenantId } from '@web/server/tenant/remembered-tenant';
import type { Metadata } from 'next';

/**
 * `[tenant]/[locale]/layout.tsx` throws `notFound()` above its own render
 * (e.g. a missing `settings_site`, an invalid locale) — a boundary declared
 * inside `[locale]` only guards that segment's *children*, not the layout
 * itself, so it never catches that throw. This file, one segment up, is
 * what does. Like the root `not-found.tsx`, it receives no route params, so
 * it reads the tenant the layout remembered before it threw rather than
 * reading the request header, which would turn this prerendered route
 * dynamic at runtime.
 */
export async function generateMetadata(): Promise<Metadata> {
  return buildNotFoundMetadata();
}

export default async function TenantNotFound() {
  return await StandaloneNotFoundPage({ tenant: getRememberedTenantId() });
}
