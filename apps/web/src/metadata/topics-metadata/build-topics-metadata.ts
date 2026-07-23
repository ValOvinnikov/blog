import { routes } from '@blog/config';
import { toMetadata } from '@web/metadata/to-metadata';
import type { Metadata } from 'next';

const TITLE = 'Topics';
const DESCRIPTION = 'Browse every post by topic.';

/**
 * Metadata for the static `/topics` hub. Unlike `buildCategoryMetadata` /
 * `buildAuthorMetadata`, this needs no per-slug fetch — the page lists every
 * category, so its title/description are fixed copy rather than derived from
 * a single document.
 */
export function buildTopicsMetadata(): Metadata {
  return toMetadata(
    {
      title: TITLE,
      description: DESCRIPTION,
      ogTitle: TITLE,
      ogDescription: DESCRIPTION,
      ogImageUrl: undefined,
    },
    { canonical: routes.topics(), ogType: 'website' },
  );
}
