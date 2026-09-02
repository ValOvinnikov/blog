import { queries } from '@blog/db';
import { isValidSignature, SIGNATURE_HEADER_NAME } from '@sanity/webhook';
import { env } from '@web/utils/env/env';
import { logger } from '@web/utils/logger/logger';
import { getRevalidateTagsForType } from '@web/utils/revalidate-tags';
import { revalidatePath, revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';

// `revalidateTag` requires the Node.js runtime (it isn't supported on Edge).
export const runtime = 'nodejs';

// Sent by Sanity on every webhook request automatically — not exported by
// any Sanity SDK, so this is the single source of truth for the literal.
export const SANITY_PROJECT_ID_HEADER = 'sanity-project-id';

// Sent by Sanity on every webhook request automatically, one of
// 'create' | 'update' | 'delete' — not exported by any Sanity SDK. Unpublish
// deletes the published document and spawns a draft, so 'delete' covers both
// true deletion and unpublish; 'create'/'update' can never reach cleanup.
export const SANITY_OPERATION_HEADER = 'sanity-operation';

const BLOG_POST_TYPE = 'blog_post';
const DELETE_OPERATION = 'delete';

interface IRevalidateWebhookBody {
  _type: string;
  _id: string;
  slug?: string;
}

const isRevalidateWebhookBody = (
  value: unknown,
): value is IRevalidateWebhookBody => {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Record<string, unknown>)['_type'] === 'string' &&
    typeof (value as Record<string, unknown>)['_id'] === 'string'
  );
};

/**
 * On-demand ISR revalidation webhook. Sanity Studio POSTs here on
 * publish/unpublish; the request is verified with `SANITY_REVALIDATE_SECRET`
 * before any cache tags are revalidated.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const secret = env.SANITY_REVALIDATE_SECRET;
  if (!secret) {
    logger.error('revalidate.secret_missing');
    return NextResponse.json(
      { message: 'Revalidation secret is not configured.' },
      { status: 500 },
    );
  }

  const signature = request.headers.get(SIGNATURE_HEADER_NAME);
  const rawBody = await request.text();

  if (!signature || !(await isValidSignature(rawBody, signature, secret))) {
    return NextResponse.json(
      { message: 'Invalid signature.' },
      { status: 401 },
    );
  }

  let parsedBody: unknown;
  try {
    parsedBody = JSON.parse(rawBody);
  } catch {
    return NextResponse.json(
      { message: 'Malformed request body.' },
      { status: 400 },
    );
  }

  if (!isRevalidateWebhookBody(parsedBody)) {
    return NextResponse.json(
      { message: 'Malformed request body.' },
      { status: 400 },
    );
  }

  const { _type: type, _id: id } = parsedBody;
  const baseTags = getRevalidateTagsForType(type, id);
  // Identifies which tenant's project published. `isr()` always emits the
  // tenant-prefixed tag now, but the legacy unprefixed form can still be
  // live in the cache from before, so both are purged.
  const tenantProjectId = request.headers.get(SANITY_PROJECT_ID_HEADER);
  const revalidated = tenantProjectId
    ? [...baseTags, ...baseTags.map((tag) => `t:${tenantProjectId}:${tag}`)]
    : baseTags;

  for (const tag of revalidated) {
    // `{ expire: 0 }` forces immediate expiration — the next request blocks
    // and renders fresh. The profile shorthand ('max' etc.) is a *stale
    // window*: it keeps serving old content while revalidating in the
    // background, which for a publish webhook means updates never appear.
    revalidateTag(tag, { expire: 0 });
  }

  // Tag expiry alone does not invalidate prerendered route entries on
  // Vercel — pages would otherwise keep serving stale content indefinitely.
  // Purging the root layout's path invalidates every page; publishes are infrequent
  // on a blog, so the whole-site blast radius is acceptable. Verified against
  // next@16.2.10 internals: every rendered route carries the implicit
  // `_N_T_/layout` tag, which `revalidatePath('/', 'layout')` expires — so
  // this covers the locale-prefixed prerenders (`/EN`) too.
  const pathPurged = revalidated.length > 0;
  if (pathPurged) {
    revalidatePath('/', 'layout');
  }

  let bookmarksRemoved = 0;
  const operation = request.headers.get(SANITY_OPERATION_HEADER);
  if (operation === DELETE_OPERATION && type === BLOG_POST_TYPE) {
    try {
      // No sole-tenant fallback here (unlike resolve-tenant-id.ts) — this is
      // a destructive delete, so an unresolvable tenant must skip cleanup
      // rather than guess.
      const tenantId = tenantProjectId
        ? await queries.tenants.getTenantIdBySanityProjectId(tenantProjectId)
        : undefined;
      if (tenantId) {
        bookmarksRemoved = await queries.bookmarks.removeBookmarksForPost(
          tenantId,
          id,
        );
      }
    } catch (error) {
      logger.error('revalidate.bookmark_cleanup_failed', {
        type,
        id,
        error,
      });
    }
  }

  return NextResponse.json(
    { revalidated, pathPurged, type, id, bookmarksRemoved },
    { status: 200 },
  );
}
