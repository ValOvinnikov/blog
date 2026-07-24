import type {
  AllSanitySchemaTypes,
  internalGroqTypeReferenceTo,
} from '@blog/config';
import { createGroqBuilder, makeSafeQueryRunner } from 'groqd';

import { getClient } from './client';

type TSchemaConfig = {
  schemaTypes: AllSanitySchemaTypes;
  referenceSymbol: typeof internalGroqTypeReferenceTo;
};

export const q = createGroqBuilder<TSchemaConfig>();

/** Shared `.parameters<T>()` shape for the slug-lookup queries (post, category, author, generic page). */
export type TSlugParams = { slug: string };

type TNextFetchOptions = {
  next?: { revalidate?: number | false; tags?: string[] };
};

export const runQuery = makeSafeQueryRunner<TNextFetchOptions>(
  (query, { parameters, next }) =>
    getClient().fetch(query, parameters ?? {}, next ? { next } : undefined),
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
 */
export const isr = (tag: string | string[]): TNextFetchOptions => ({
  next: { revalidate: 3600, tags: Array.isArray(tag) ? tag : [tag] },
});
