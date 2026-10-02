import { LOCALE_BCP47_TAGS } from '@blog/config';
import { StandaloneNotFoundPage } from '@web/components/pages/standalone-not-found-page';
import { DocumentShell } from '@web/components/shared/document-shell';
import { buildNotFoundMetadata } from '@web/metadata/not-found-metadata';
import { peekContextTenantId } from '@web/server/request-context/request-context';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return buildNotFoundMetadata();
}

/**
 * Catches a `notFound()` thrown by `[tenant]/[locale]/layout.tsx` itself
 * (e.g. a missing `settings_site`, an invalid locale), reading the tenant
 * the layout entered into the request context before it threw rather than
 * the request header.
 * It sits above that layout, so it owns the document.
 */
export default async function TenantNotFound() {
  return (
    <DocumentShell lang={LOCALE_BCP47_TAGS.EN}>
      {await StandaloneNotFoundPage({ tenant: peekContextTenantId() })}
    </DocumentShell>
  );
}
