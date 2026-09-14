import { NotFoundPage } from '@web/components/pages/not-found-page';
import { buildNotFoundMetadata } from '@web/metadata/not-found-metadata';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return buildNotFoundMetadata();
}

/**
 * Intended to catch a `notFound()` thrown inside `[tenant]/[locale]`'s page
 * tree. In the current build none reach it: the layout's own
 * `generateStaticParams` classifies the whole subtree for on-demand
 * blocking generation, so every content `notFound()` beneath it — an
 * absent backing document, a pagination-overflow guard, even an index page
 * with no `generateStaticParams` of its own — escalates past this boundary
 * to the unthemed root instead.
 */
export default function TenantLocaleNotFound() {
  return <NotFoundPage shouldFillViewport={false} />;
}
