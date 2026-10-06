import { SANITY_CONTENT_REVALIDATE_SECONDS } from '@blog/config';

type TIsrOptions = {
  next: { revalidate: number; tags: string[] };
};

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
      revalidate: SANITY_CONTENT_REVALIDATE_SECONDS,
      tags: tags.map((t) => `t:${scopeProjectId}:${t}`),
    },
  };
}
