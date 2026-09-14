import { NotFoundPage } from '@web/components/pages/not-found-page';
import { buildNotFoundMetadata } from '@web/metadata/not-found-metadata';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return buildNotFoundMetadata();
}

/**
 * Catches every `notFound()` thrown inside `[tenant]/[locale]`'s page tree —
 * pagination overflow, an absent backing document. `[tenant]/[locale]/layout.tsx`
 * has already rendered successfully by the time this runs, so it renders only
 * the bare `NotFoundPage` body and inherits the layout's `ThemeScope`,
 * `NextIntlClientProvider`, and `Header`/`Footer` chrome rather than
 * resolving any of it itself.
 */
export default function TenantLocaleNotFound() {
  return <NotFoundPage />;
}
