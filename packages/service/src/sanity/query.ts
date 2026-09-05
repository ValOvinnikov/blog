import type {
  AllSanitySchemaTypes,
  internalGroqTypeReferenceTo,
} from '@blog/config';
import { createGroqBuilder, makeSafeQueryRunner } from 'groqd';

import { getClient, type TTenantSanityContext } from './client';

// Re-exported so downstream loaders/callers can `import { ...,
// type TTenantSanityContext } from '@blog/service/sanity/query'` without
// also reaching into './client' directly.
export type { TTenantSanityContext };

type TSchemaConfig = {
  schemaTypes: AllSanitySchemaTypes;
  referenceSymbol: typeof internalGroqTypeReferenceTo;
};

export const q = createGroqBuilder<TSchemaConfig>();

/** Shared `.parameters<T>()` shape for the slug-lookup queries (post, topic, author, generic page). */
export type TSlugParams = { slug: string };

type TNextFetchOptions = {
  next?: { revalidate?: number | false; tags?: string[] };
  tenant: TTenantSanityContext;
};

/** `isr(...)`'s return shape — only the cache-tag half of `TNextFetchOptions`, spread alongside a caller's own `tenant`. */
type TIsrOptions = {
  next: { revalidate: number; tags: string[] };
};

export const runQuery = makeSafeQueryRunner<TNextFetchOptions>(
  (query, { parameters, next, tenant }) =>
    getClient(tenant).fetch(
      query,
      parameters ?? {},
      next ? { next } : undefined,
    ),
);

/**
 * Tag-scope contract: a loader's `isr(...)` call must cover every document
 * `_type` its query can read, not just the `_type` the query is filtered on.
 * If a query's fragment `.deref()`s another document (a post's `author`/
 * `topic`, a `link`'s `internalReference`, …), the loader's tags must
 * include that dereferenced type's tag too — resolve the exact tag string
 * from `REVALIDATE_TAGS` in `apps/web/src/utils/revalidate-tags/
 * revalidate-tags.ts` (the webhook's source of truth for `_type` → tag),
 * never invent a new one. Getting this right keeps content fresh, but a
 * missed tag is not the only safeguard: the webhook resolves and purges the
 * specific affected path(s), falling back to a blanket
 * `revalidatePath('/', 'layout')` only when path derivation fails, and each
 * content route's own `export const revalidate`
 * (`CONTENT_ROUTE_REVALIDATE_SECONDS` from `@blog/config`) bounds how long
 * a missed or failed purge can stay visible regardless.
 *
 * `scopeProjectId` is required — every tag is prefixed `t:<projectId>:<tag>`,
 * the platform's own project id included (`getPlatformSanityContext().
 * projectId`). The revalidation webhook (`apps/web/src/app/api/revalidate/
 * route.ts`) always purges the unprefixed and prefixed form together, so
 * this stays correct regardless of which project published.
 */
export function isr(
  tag: string | string[],
  scopeProjectId: string,
): TIsrOptions {
  const tags = Array.isArray(tag) ? tag : [tag];

  return {
    next: {
      revalidate: 3600,
      tags: tags.map((t) => `t:${scopeProjectId}:${t}`),
    },
  };
}
