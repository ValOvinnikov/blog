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

/** Shared `.parameters<T>()` shape for the slug-lookup queries (post, category, author, generic page). */
export type TSlugParams = { slug: string };

type TNextFetchOptions = {
  next?: { revalidate?: number | false; tags?: string[] };
  tenant?: TTenantSanityContext;
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
 * `category`, a `link`'s `internalReference`, …), the loader's tags must
 * include that dereferenced type's tag too — resolve the exact tag string
 * from `REVALIDATE_TAGS` in `apps/web/src/utils/revalidate-tags.ts` (the
 * webhook's source of truth for `_type` → tag), never invent a new one. This
 * is a defensive completeness rule for the tag scheme itself — it does not
 * replace or depend on the webhook's blanket `revalidatePath('/', 'layout')`
 * backstop, which stays regardless.
 *
 * No-arg `scopeProjectId` keeps producing the legacy unprefixed tags (every
 * loader not yet migrated to per-tenant context). Passed a `projectId`,
 * every tag is prefixed `t:<projectId>:<tag>` — the revalidation webhook
 * (`apps/web/src/app/api/revalidate/route.ts`) purges both forms on every
 * publish, so this is forward-compatible with loaders migrating one at a
 * time, no webhook change required per loader.
 */
export const isr = (
  tag: string | string[],
  scopeProjectId?: string,
): TNextFetchOptions => {
  const tags = Array.isArray(tag) ? tag : [tag];

  return {
    next: {
      revalidate: 3600,
      tags: scopeProjectId ? tags.map((t) => `t:${scopeProjectId}:${t}`) : tags,
    },
  };
};
