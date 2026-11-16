import {
  HTTP_STATUS,
  SANITY_WEBHOOK_OPERATION,
} from '@shinefold/config/constants';
import { REVALIDATE_LOG } from '@web/constants/revalidate';
import { buildRevalidatedTags } from '@web/server/revalidate/build-revalidated-tags/build-revalidated-tags';
import { POST_TYPE } from '@web/server/revalidate/derive-revalidate-paths/derive-revalidate-paths';
import { purgeRevalidatedCache } from '@web/server/revalidate/purge-revalidated-cache/purge-revalidated-cache';
import { readSignedTenantRequest } from '@web/server/signed-request/read-signed-tenant-request/read-signed-tenant-request';
import { env } from '@web/utils/env/env';
import { getRevalidateTagsForType } from '@web/utils/revalidate-tags';
import { NextResponse } from 'next/server';
import { z } from 'zod';

export const runtime = 'nodejs';

const requestBodySchema = z.object({
  tenantId: z.uuid(),
  postId: z.string().min(1),
});

export async function POST(request: Request): Promise<NextResponse> {
  const signed = await readSignedTenantRequest(request, requestBodySchema, {
    secret: env.SANITY_REVALIDATE_SECRET,
    log: {
      SECRET_MISSING: REVALIDATE_LOG.SECRET_MISSING,
      TENANT_LOOKUP_FAILED: REVALIDATE_LOG.SCHEDULED_PURGE_TENANT_LOOKUP_FAILED,
    },
  });
  if ('refusal' in signed) {
    return signed.refusal;
  }
  const {
    body: { tenantId, postId },
    tenant,
  } = signed;

  const revalidated = await buildRevalidatedTags({
    baseTags: getRevalidateTagsForType(POST_TYPE, postId),
    type: POST_TYPE,
    id: postId,
    tenantId,
    tenantProjectId: tenant.projectId,
    tenantSanity: tenant,
  });
  const pathPurged = await purgeRevalidatedCache({
    tags: revalidated,
    type: POST_TYPE,
    id: postId,
    slug: undefined,
    previousSlug: undefined,
    operation: SANITY_WEBHOOK_OPERATION.UPDATE,
    tenantId,
    tenant,
  });

  return NextResponse.json(
    { revalidated, pathPurged },
    { status: HTTP_STATUS.OK },
  );
}
