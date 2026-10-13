import { LocaleNotFoundPage } from '@web/components/pages/locale-not-found-page';
import { buildNotFoundMetadata } from '@web/metadata/not-found-metadata';
import { getNotFoundContext } from '@web/server/request-context/request-context';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  const { tenantId, locale } = await getNotFoundContext();

  return buildNotFoundMetadata({ tenant: tenantId, locale });
}

export default function LocaleNotFound() {
  return <LocaleNotFoundPage />;
}
