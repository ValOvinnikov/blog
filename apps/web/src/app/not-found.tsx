import { StandaloneNotFoundPage } from '@web/components/pages/standalone-not-found-page';
import { buildNotFoundMetadata } from '@web/metadata/not-found-metadata';
import { getRequestTenantId } from '@web/server/tenant/get-request-tenant-id';
import type { Metadata } from 'next';

/**
 * The root-level not-found boundary — it renders outside
 * `[tenant]/[locale]/layout.tsx` entirely (see `app/layout.tsx`'s doc
 * comment), so it has no tenant/locale context to inherit and resolves its
 * own theme tokens and messages via `StandaloneNotFoundPage` rather than
 * depending on that layout's providers. It has no `[tenant]` route param
 * either, so it's the one boundary still allowed to fall through to the
 * request header for a tenant id.
 */
export async function generateMetadata(): Promise<Metadata> {
  return buildNotFoundMetadata();
}

export default async function NotFound() {
  const tenant = await getRequestTenantId();
  return await StandaloneNotFoundPage({ tenant });
}
