import { StandaloneNotFoundPage } from '@web/components/pages/standalone-not-found-page';
import { buildNotFoundMetadata } from '@web/metadata/not-found-metadata';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return buildNotFoundMetadata();
}

/**
 * The root-level not-found boundary — it renders outside
 * `[tenant]/[locale]/layout.tsx` entirely (see `app/layout.tsx`'s doc
 * comment), so it has no tenant/locale context to inherit and resolves its
 * own theme tokens and messages via `StandaloneNotFoundPage` rather than
 * depending on that layout's providers. It never reads the request header
 * for a tenant id — Next treats `headers()` as fatal inside a route it has
 * committed to static generation, so this boundary always renders the
 * default, unthemed 404. That static-generation window covers every
 * content `notFound()` under `[tenant]/[locale]` today, not just a
 * genuinely tenant-less URL, so this is the boundary most 404s actually hit.
 */
export default async function NotFound() {
  return await StandaloneNotFoundPage();
}
