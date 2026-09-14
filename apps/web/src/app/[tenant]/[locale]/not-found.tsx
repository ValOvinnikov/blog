import { NotFoundPage } from '@web/components/pages/not-found-page';
import { buildNotFoundMetadata } from '@web/metadata/not-found-metadata';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return buildNotFoundMetadata();
}

/**
 * Catches every `notFound()` thrown inside `[tenant]/[locale]`'s page tree —
 * pagination overflow, an absent backing document.
 */
export default function TenantLocaleNotFound() {
  return <NotFoundPage shouldFillViewport={false} />;
}
