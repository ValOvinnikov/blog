import { LOCALE_BCP47_TAGS } from '@shinefold/config';
import { StandaloneNotFoundPage } from '@web/components/pages/standalone-not-found-page';
import { DocumentShell } from '@web/components/shared/document-shell';
import { buildNotFoundMetadata } from '@web/metadata/not-found-metadata';
import { getNotFoundContext } from '@web/server/request-context/request-context';
import { getLockedColorScheme } from '@web/server/site-config/get-locked-color-scheme/get-locked-color-scheme';
import { UNRESOLVED_TENANT_PLACEHOLDER } from '@web/server/tenant/constants/constants';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  const { tenantId, locale } = await getNotFoundContext();

  return buildNotFoundMetadata({ tenant: tenantId, locale });
}

/** Owns the document for a `notFound()` thrown by `[tenant]/[locale]/layout.tsx` itself, which no same-segment boundary catches, and must never call `headers()`. */
export default async function TenantNotFound() {
  const { tenantId, locale, defaultLocale } = await getNotFoundContext();
  const lockedColorScheme = await getLockedColorScheme(
    tenantId ?? UNRESOLVED_TENANT_PLACEHOLDER,
  );

  return (
    <DocumentShell
      lang={LOCALE_BCP47_TAGS[locale]}
      lockedColorScheme={lockedColorScheme}
    >
      {await StandaloneNotFoundPage({
        tenant: tenantId,
        locale,
        defaultLocale,
      })}
    </DocumentShell>
  );
}
