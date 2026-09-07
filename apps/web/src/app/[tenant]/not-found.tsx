import { StandaloneNotFoundPage } from '@web/components/pages/standalone-not-found-page';
import { buildNotFoundMetadata } from '@web/metadata/not-found-metadata';
import type { Metadata } from 'next';

/**
 * `[tenant]/[locale]/layout.tsx` throws `notFound()` above its own render
 * (e.g. a missing `settings_site`) — a boundary declared inside `[locale]`
 * only guards that segment's *children*, not the layout itself, so it never
 * catches that throw. This file, one segment up, is what does. Like the
 * root `not-found.tsx`, it receives no route params, so it resolves its own
 * theme/messages via `StandaloneNotFoundPage` rather than depending on the
 * layout that just failed.
 */
export async function generateMetadata(): Promise<Metadata> {
  return buildNotFoundMetadata();
}

export default async function TenantNotFound() {
  return await StandaloneNotFoundPage();
}
