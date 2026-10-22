import type { TMaybeUndefined } from '@blog/config';
import { HTTP_STATUS } from '@blog/config/constants';
import { queries } from '@blog/db';
import type { TTenantSanityContext } from '@blog/service';
import { isValidSignature, SIGNATURE_HEADER_NAME } from '@sanity/webhook';
import {
  PATH_PURGE_FALLBACK_EVENT,
  TENANT_LOOKUP_FAILED_MESSAGE,
} from '@web/constants/revalidate';
import {
  deriveRevalidatePaths,
  isDerivableRevalidateType,
  POST_TYPE,
} from '@web/server/revalidate/derive-revalidate-paths/derive-revalidate-paths';
import { recordTenantActivity } from '@web/server/revalidate/record-tenant-activity/record-tenant-activity';
import { resolveReferencingModuleTags } from '@web/server/revalidate/resolve-referencing-module-tags/resolve-referencing-module-tags';
import { env } from '@web/utils/env/env';
import { logger } from '@web/utils/logger/logger';
import { getRevalidateTagsForType } from '@web/utils/revalidate-tags';
import { revalidatePath, revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';

// `revalidateTag` requires the Node.js runtime (it isn't supported on Edge).
export const runtime = 'nodejs';

// Sent by Sanity on every webhook request; no Sanity SDK exports it.
export const SANITY_PROJECT_ID_HEADER = 'sanity-project-id';

// Unpublish arrives as 'delete' too: it deletes the published document and spawns a draft.
export const SANITY_OPERATION_HEADER = 'sanity-operation';

const DELETE_OPERATION = 'delete';
const MALFORMED_BODY_MESSAGE = 'Malformed request body.';

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

const resolveDerivedRevalidatePaths = async (
  type: string,
  id: string,
  tenantId: TMaybeUndefined<string>,
  tenant: TMaybeUndefined<TTenantSanityContext>,
): Promise<TResolvedRevalidatePaths> => {
  if (!tenantId) {
    return { ok: false, reason: 'tenant_unresolved' };
  }
  if (!isDerivableRevalidateType(type)) {
    return { ok: false, reason: 'unsupported_type' };
  }
  if (!tenant) {
    return { ok: false, reason: 'fetch_failed' };
  }

  const derived = await deriveRevalidatePaths({ type, id, tenantId, tenant });
  if (derived.ok) return derived;
  return { ok: false, reason: derived.reason };
};

export async function POST(request: Request): Promise<NextResponse> {
  const secret = env.SANITY_REVALIDATE_SECRET;
  if (!secret) {
    logger.error('revalidate.secret_missing');
    return NextResponse.json(
      { message: 'Revalidation secret is not configured.' },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }

  const signature = request.headers.get(SIGNATURE_HEADER_NAME);
  const rawBody = await request.text();

  if (!signature || !(await isValidSignature(rawBody, signature, secret))) {
    return NextResponse.json(
      { message: 'Invalid signature.' },
      { status: HTTP_STATUS.UNAUTHORIZED },
    );
  }

  let parsedBody: unknown;
  try {
    parsedBody = JSON.parse(rawBody);
  } catch {
    return NextResponse.json(
      { message: MALFORMED_BODY_MESSAGE },
      { status: HTTP_STATUS.BAD_REQUEST },
    );
  }

  if (!isRevalidateWebhookBody(parsedBody)) {
    return NextResponse.json(
      { message: MALFORMED_BODY_MESSAGE },
      { status: HTTP_STATUS.BAD_REQUEST },
    );
  }

  const { _type: type, _id: id } = parsedBody;

  const tenantProjectId = request.headers.get(SANITY_PROJECT_ID_HEADER);

  let tenantId: TMaybeUndefined<string>;
  if (tenantProjectId) {
    try {
      tenantId =
        await queries.tenants.getTenantIdBySanityProjectId(tenantProjectId);
    } catch (error) {
      logger.error('revalidate.tenant_id_lookup_failed', {
        tenantProjectId,
        error,
      });
      return NextResponse.json(
        { message: TENANT_LOOKUP_FAILED_MESSAGE },
        { status: 502 },
      );
    }
  }

  if (tenantId) {
    let tenant;
    try {
      tenant = await queries.tenants.getTenantById(tenantId);
    } catch (error) {
      logger.error('revalidate.tenant_by_id_lookup_failed', {
        tenantId,
        error,
      });
      return NextResponse.json(
        { message: TENANT_LOOKUP_FAILED_MESSAGE },
        { status: 502 },
      );
    }
    if (!tenant) {
      logger.warn('revalidate.tenant_archived', { tenantProjectId, tenantId });
      return NextResponse.json(
        { message: 'Tenant is archived; event ignored.' },
        { status: HTTP_STATUS.OK },
      );
    }

    await recordTenantActivity(tenantId, new Date());
  }

  const baseTags = getRevalidateTagsForType(type, id);

  // Fetched once — the module lookup and the path derivation both need it, and fetching twice would report one failure as two.
  let tenantSanity;
  if (tenantId && baseTags.length > 0) {
    try {
      tenantSanity = await queries.tenants.getTenantSanityCredentials(tenantId);
      if (!tenantSanity) {
        logger.error('revalidate.tenant_sanity_credentials_missing', {
          type,
          id,
          tenantId,
        });
      }
    } catch (error) {
      logger.error('revalidate.tenant_sanity_credentials_fetch_threw', {
        type,
        id,
        tenantId,
        error,
      });
    }
  }

  const moduleTags =
    tenantId && tenantSanity
      ? await resolveReferencingModuleTags({
          type,
          id,
          tenantId,
          tenant: tenantSanity,
        })
      : [];

  const allTags = [...baseTags, ...moduleTags];
  const revalidated = tenantProjectId
    ? [...allTags, ...allTags.map((tag) => `t:${tenantProjectId}:${tag}`)]
    : allTags;

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
  // tenant's request, never one tenant's alone.
  const pathPurged = revalidated.length > 0;
  if (pathPurged) {
    const derived = await resolveDerivedRevalidatePaths(
      type,
      id,
      tenantId,
      tenantSanity,
    );
    if (derived.ok) {
      for (const path of derived.paths) {
        revalidatePath(path);
      }
    } else {
      logger.warn(PATH_PURGE_FALLBACK_EVENT, {
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
  if (operation === DELETE_OPERATION && type === POST_TYPE && tenantId) {
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
    { status: HTTP_STATUS.OK },
  );
}
