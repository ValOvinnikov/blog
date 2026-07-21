import { routes } from '@blog/config';
import { service } from '@blog/service';
import { toMetadata } from '@web/metadata/to-metadata';
import { blockTextToPlain } from '@web/utils/block-text-to-plain';
import type { Metadata } from 'next';

/**
 * Metadata for an `/author/[slug]` page. `TAuthorDetail` carries no
 * dedicated `seo`/OG fields (same situation as `TCategory`), so this builds
 * `Metadata` directly from the author's own `name`/`role`/`bio` rather than
 * inventing fields the service layer doesn't provide.
 *
 * Reuses `getAuthor` (also called by `AuthorPage`) — Next dedupes the fetch
 * per request, so this adds no extra round-trip.
 */
export async function buildAuthorMetadata(slug: string): Promise<Metadata> {
  const author = await service.entities.author.v1.getAuthor(slug);

  if (!author) {
    return {};
  }

  const title = author.role ? `${author.name} — ${author.role}` : author.name;
  const description = blockTextToPlain(author.bio) ?? title;

  return toMetadata(
    {
      title,
      description,
      ogTitle: title,
      ogDescription: description,
      ogImageUrl: author.imageUrl,
    },
    { canonical: routes.author(slug), ogType: 'website' },
  );
}
