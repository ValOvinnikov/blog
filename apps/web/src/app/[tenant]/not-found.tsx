import { LOCALE_BCP47_TAGS } from '@blog/config';
import { StandaloneNotFoundPage } from '@web/components/pages/standalone-not-found-page';
import { DocumentShell } from '@web/components/shared/document-shell';
import { buildNotFoundMetadata } from '@web/metadata/not-found-metadata';
import { getNotFoundContext } from '@web/server/request-context/request-context';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  const { tenantId, locale } = await getNotFoundContext();

  return buildNotFoundMetadata({ tenant: tenantId, locale });
}

/**
 * Catches a `notFound()` thrown by `[tenant]/[locale]/layout.tsx` itself,
 * which a same-segment boundary cannot; it sits above that layout, so it owns
 * the document. Must never call `headers()`.
 */
export default async function TenantNotFound() {
  const { tenantId, locale } = await getNotFoundContext();

  return (
    <DocumentShell lang={LOCALE_BCP47_TAGS[locale]}>
      {await StandaloneNotFoundPage({ tenant: tenantId, locale })}
    </DocumentShell>
  );
}
