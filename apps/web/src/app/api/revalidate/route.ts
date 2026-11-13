import { HTTP_STATUS } from '@blog/config/constants';
import { hasLength } from '@blog/utils/primitives';
import { SIGNATURE_HEADER_NAME } from '@sanity/webhook';
import {
  REVALIDATE_LOG,
  TENANT_LOOKUP_FAILED_MESSAGE,
} from '@web/constants/revalidate';
import { buildRevalidatedTags } from '@web/server/revalidate/build-revalidated-tags/build-revalidated-tags';
import { isRevalidateWebhookBody } from '@web/server/revalidate/is-revalidate-webhook-body/is-revalidate-webhook-body';
import { loadTenantSanityCredentials } from '@web/server/revalidate/load-tenant-sanity-credentials/load-tenant-sanity-credentials';
import { purgeRevalidatedCache } from '@web/server/revalidate/purge-revalidated-cache/purge-revalidated-cache';
import { removeDeletedPostBookmarks } from '@web/server/revalidate/remove-deleted-post-bookmarks/remove-deleted-post-bookmarks';
import { resolveWebhookTenant } from '@web/server/revalidate/resolve-webhook-tenant/resolve-webhook-tenant';
import { stampFirstPostPublished } from '@web/server/revalidate/stamp-first-post-published/stamp-first-post-published';
import { startNewsletterPostSend } from '@web/server/revalidate/start-newsletter-post-send/start-newsletter-post-send';
import { verifyRevalidateSignature } from '@web/server/revalidate/verify-revalidate-signature/verify-revalidate-signature';
import { env } from '@web/utils/env/env';
import { logger } from '@web/utils/logger/logger';
import { getRevalidateTagsForType } from '@web/utils/revalidate-tags';
import { NextResponse } from 'next/server';

// `revalidateTag` requires the Node.js runtime (it isn't supported on Edge).
export const runtime = 'nodejs';

// Sent by Sanity on every webhook request; no Sanity SDK exports it.
export const SANITY_PROJECT_ID_HEADER = 'sanity-project-id';

// Unpublish arrives as 'delete' too: it deletes the published document and spawns a draft.
export const SANITY_OPERATION_HEADER = 'sanity-operation';

const MALFORMED_BODY_MESSAGE = 'Malformed request body.';

export async function POST(request: Request): Promise<NextResponse> {
  const secret = env.SANITY_REVALIDATE_SECRET;
  if (!secret) {
    logger.error(REVALIDATE_LOG.SECRET_MISSING);
    return NextResponse.json(
      { message: 'Revalidation secret is not configured.' },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }

  const tenantProjectId = request.headers.get(SANITY_PROJECT_ID_HEADER);
  const rawBody = await request.text();

  let verified;
  try {
    verified = await verifyRevalidateSignature({
      rawBody,
      signature: request.headers.get(SIGNATURE_HEADER_NAME),
      projectId: tenantProjectId,
      sharedSecret: secret,
      now: Date.now(),
    });
  } catch (error) {
    logger.error(REVALIDATE_LOG.TENANT_ID_LOOKUP_FAILED, {
      tenantProjectId,
      error,
    });
    return NextResponse.json(
      { message: TENANT_LOOKUP_FAILED_MESSAGE },
      { status: HTTP_STATUS.BAD_GATEWAY },
    );
  }

  if (!verified.ok) {
    return NextResponse.json(
      { message: 'Invalid signature.' },
      { status: HTTP_STATUS.UNAUTHORIZED },
    );
  }

  let parsedBody: unknown;
  try {
    parsedBody = JSON.parse(rawBody);
  } catch {
    parsedBody = undefined;
  }

  if (!isRevalidateWebhookBody(parsedBody)) {
    return NextResponse.json(
      { message: MALFORMED_BODY_MESSAGE },
      { status: HTTP_STATUS.BAD_REQUEST },
    );
  }

  const { _type: type, _id: id, slug } = parsedBody;
  const tenantId = verified.data;

  const tenantRefusal = await resolveWebhookTenant(tenantId, tenantProjectId);
  if (tenantRefusal) {
    return tenantRefusal;
  }

  const baseTags = getRevalidateTagsForType(type, id);
  const tenantSanity =
    tenantId && hasLength(baseTags)
      ? await loadTenantSanityCredentials({ type, id, tenantId })
      : undefined;

  const revalidated = await buildRevalidatedTags({
    baseTags,
    type,
    id,
    tenantId,
    tenantProjectId,
    tenantSanity,
  });
  const pathPurged = await purgeRevalidatedCache({
    tags: revalidated,
    type,
    id,
    slug,
    tenantId,
    tenant: tenantSanity,
  });
  const operation = request.headers.get(SANITY_OPERATION_HEADER);
  const postEvent = { operation, type, id, tenantId };
  const bookmarksRemoved = await removeDeletedPostBookmarks(postEvent);
  await stampFirstPostPublished(postEvent);
  await startNewsletterPostSend(postEvent);

  return NextResponse.json(
    { revalidated, pathPurged, type, id, bookmarksRemoved },
    { status: HTTP_STATUS.OK },
  );
}
