import { LOCALE_BCP47_TAGS } from '@blog/config';
import { StandaloneNotFoundPage } from '@web/components/pages/standalone-not-found-page';
import { DocumentShell } from '@web/components/shared/document-shell';
import { buildNotFoundMetadata } from '@web/metadata/not-found-metadata';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return buildNotFoundMetadata();
}

/**
 * Catches a `notFound()` thrown by `[tenant]/[locale]/layout.tsx` itself,
 * which a same-segment boundary cannot; it sits above that layout, so it owns
 * the document. Resolves no tenant and must never call `headers()`.
 */
export default async function TenantNotFound() {
  return (
    <DocumentShell lang={LOCALE_BCP47_TAGS.EN}>
      {await StandaloneNotFoundPage()}
    </DocumentShell>
  );
}
