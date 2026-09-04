import { queries } from '@blog/db';
import { isValidSignature, SIGNATURE_HEADER_NAME } from '@sanity/webhook';
import {
  BLOG_POST_TYPE,
  deriveRevalidatePaths,
  isDerivableRevalidateType,
} from '@web/server/revalidate/derive-revalidate-paths';
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

type TResolvedRevalidatePaths =
  { ok: true; paths: string[] } | { ok: false; reason: string };

/**
 * Resolves the precise, tenant-scoped paths a published document affects.
 * Anything that isn't derivable — no resolved tenant, a `_type` without a
 * precise derivation yet, or a failed lookup — reports why so the caller can
 * fall back to a whole-site purge instead of serving stale content.
 */
const resolveDerivedRevalidatePaths = async (
  type: string,
  id: string,
  tenantId: string | undefined,
): Promise<TResolvedRevalidatePaths> => {
  if (!tenantId) {
    return { ok: false, reason: 'tenant_unresolved' };
  }
  if (!isDerivableRevalidateType(type)) {
    return { ok: false, reason: 'unsupported_type' };
  }

  const tenant = await queries.tenants.getTenantSanityCredentials(tenantId);
  if (!tenant) {
    logger.error('revalidate.tenant_sanity_credentials_missing', {
      type,
      id,
      tenantId,
    });
    return { ok: false, reason: 'fetch_failed' };
  }

  const derived = await deriveRevalidatePaths({ type, id, tenantId, tenant });
  if (derived.ok) return derived;
  return { ok: false, reason: derived.reason };
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
  // Vercel, so a path purge is required alongside the tag purge above.
  // `revalidatePath` only matches a fully resolved path (`/<tenantId>/EN/
  // blog/x`) — the bracketed route pattern (`'/', 'layout'`) matches every
  // tenant's request, never one tenant's alone — so a precise derivation is
  // purged path-by-path, and anything not (yet) derivable falls back to
  // that whole-site purge, loudly logged rather than silently incomplete.
  const pathPurged = revalidated.length > 0;
  if (pathPurged) {
    const derived = await resolveDerivedRevalidatePaths(type, id, tenantId);
    if (derived.ok) {
      for (const path of derived.paths) {
        revalidatePath(path);
      }
    } else {
      logger.warn('revalidate.path_purge_fallback', {
        type,
        id,
        tenantId,
        reason: derived.reason,
      });
      revalidatePath('/', 'layout');
    }
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
