import { routes } from '@blog/config';
import { createLogger } from '@blog/insight';
import { service } from '@blog/service';
import { toMetadata } from '@web/metadata/to-metadata';
import type { Metadata } from 'next';

const logger = createLogger();

/**
 * Metadata for a `/[slug]` standalone page (`page_generic`). Unlike
 * `TCategory`/`TAuthorDetail`, `TGenericPage.seo` is already a fully-resolved
 * `TSeoResolved` (authored → content → site defaults), so this maps it
 * straight through `toMetadata` rather than building fallback fields itself.
 *
 * Reuses `getPage` (also called by `GenericPage`) — Next dedupes the fetch
 * per request, so this adds no extra round-trip.
 */
export async function buildGenericPageMetadata(
  slug: string,
): Promise<Metadata> {
  const result = await service.pages.generic.v1.getPage(slug);

  if (!result.ok) {
    logger.error('generic_page_metadata.fetch_failed', {
      slug,
      error: result.error,
    });
    return {};
  }

  return toMetadata(result.data.seo, {
    canonical: routes.genericPage(slug),
    ogType: 'website',
  });
}
