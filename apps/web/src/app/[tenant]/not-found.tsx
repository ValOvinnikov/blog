import { StandaloneNotFoundPage } from '@web/components/pages/standalone-not-found-page';
import { buildNotFoundMetadata } from '@web/metadata/not-found-metadata';
import type { Metadata } from 'next';

/**
 * `[tenant]/[locale]/layout.tsx` throws `notFound()` above its own render
 * (e.g. a missing `settings_site`) — a boundary declared inside `[locale]`
 * only guards that segment's *children*, not the layout itself, so it never
 * catches that throw. This file, one segment up, is what does. Like the
 * root `not-found.tsx`, it receives no route params, but unlike it, it
 * skips tenant resolution entirely and renders with default theme tokens
 * and base messages — the layout that would have supplied the tenant's own
 * just failed, and reading the request header here would turn this
 * prerendered route dynamic at runtime.
 */
export async function generateMetadata(): Promise<Metadata> {
  return buildNotFoundMetadata();
}

export default async function TenantNotFound() {
  return await StandaloneNotFoundPage({ shouldResolveTenant: false });
}
