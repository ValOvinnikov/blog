import { LOCALE_BCP47_TAGS } from '@blog/config';
import { StandaloneNotFoundPage } from '@web/components/pages/standalone-not-found-page';
import { DocumentShell } from '@web/components/shared/document-shell';
import { buildNotFoundMetadata } from '@web/metadata/not-found-metadata';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return buildNotFoundMetadata();
}

/** Serves URLs that match no route — resolves no tenant and must never call `headers()`. */
export default async function GlobalNotFound() {
  return (
    <DocumentShell lang={LOCALE_BCP47_TAGS.EN}>
      {await StandaloneNotFoundPage()}
    </DocumentShell>
  );
}
