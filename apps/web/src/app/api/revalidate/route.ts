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

  // Identifies which tenant's project published. `isr()` always emits the
  // tenant-prefixed tag now, but the legacy unprefixed form can still be
  // live in the cache from before, so both are purged below. Resolved once,
  // up front, so both the archived-tenant check and the delete-cleanup
  // branch further down share the same lookup.
  const tenantProjectId = request.headers.get(SANITY_PROJECT_ID_HEADER);
  const tenantId = tenantProjectId
    ? await queries.tenants.getTenantIdBySanityProjectId(tenantProjectId)
    : undefined;

  if (tenantId && !(await queries.tenants.getTenantById(tenantId))) {
    logger.warn('revalidate.tenant_archived', { tenantProjectId, tenantId });
    return NextResponse.json(
      { message: 'Tenant is archived; event ignored.' },
      { status: 200 },
    );
  }

  const baseTags = getRevalidateTagsForType(type, id);
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
  // Vercel, so every publish purges the whole site rather than just the
  // publishing tenant's pages. Per-tenant scoping isn't expressible here:
  // Next derives each route's implicit layout tags from the route
  // *pattern* with dynamic segments unresolved (`_N_T_/[tenant]/layout`),
  // never from a resolved value, so `revalidatePath('/<tenantId>', 'layout')`
  // matches nothing. Purging each resolved tenant path individually would
  // work and is tracked separately.
  const pathPurged = revalidated.length > 0;
  if (pathPurged) {
    revalidatePath('/', 'layout');
  }

  let bookmarksRemoved = 0;
  const operation = request.headers.get(SANITY_OPERATION_HEADER);
  if (operation === DELETE_OPERATION && type === BLOG_POST_TYPE && tenantId) {
    try {
      bookmarksRemoved = await queries.bookmarks.removeBookmarksForPost(
        tenantId,
        id,
      );
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
