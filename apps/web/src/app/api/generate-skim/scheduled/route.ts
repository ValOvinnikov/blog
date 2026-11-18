import { HTTP_STATUS, type TMaybeUndefined } from '@shinefold/config';
import type { TTenant } from '@shinefold/db/schema/tenants';
import { service, type TTenantSanityContext } from '@shinefold/service';
import { GENERATE_SKIM_LOG } from '@web/constants/generate-skim';
import { readSignedTenantRequest } from '@web/server/signed-request/read-signed-tenant-request/read-signed-tenant-request';
import { generatePostSkim } from '@web/server/skim/generate-post-skim/generate-post-skim';
import { hasExistingTakeaways } from '@web/server/skim/has-existing-takeaways/has-existing-takeaways';
import { skimResponse } from '@web/server/skim/skim-response/skim-response';
import { resolveTenantById } from '@web/server/tenant/resolve-tenant/resolve-tenant';
import { toTenantSanityWriteContext } from '@web/server/tenant/tenant-sanity-context/tenant-sanity-context';
import { respondEmpty } from '@web/utils/empty-response/empty-response';
import { env } from '@web/utils/env/env';
import { logger } from '@web/utils/logger/logger';
import { NextResponse } from 'next/server';
import { z } from 'zod';

export const runtime = 'nodejs';

const requestBodySchema = z.object({
  tenantId: z.uuid(),
  postId: z.string().min(1),
  publishedAt: z.string().min(1),
});

type TGoLiveRequest = z.infer<typeof requestBodySchema>;

const refuseUnlessGoingLive = async (
  { tenantId, postId, publishedAt }: TGoLiveRequest,
  readTenant: TTenantSanityContext,
): Promise<TMaybeUndefined<NextResponse>> => {
  const result = await service.entities.posts.v1.getPostPublishedAt(
    postId,
    readTenant,
  );
  if (!result.ok) {
    logger.error(GENERATE_SKIM_LOG.PUBLISHED_AT_LOOKUP_FAILED, {
      tenantId,
      postId,
      error: result.error,
    });
    return respondEmpty(HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
  const { data: currentPublishedAt } = result;
  const goLiveMs = Date.parse(publishedAt);
  if (!currentPublishedAt || Date.parse(currentPublishedAt) !== goLiveMs) {
    return respondEmpty(HTTP_STATUS.NO_CONTENT);
  }
  // A non-2xx makes the worker retry, so a run that wakes just before the date still generates.
  if (goLiveMs > Date.now()) {
    return respondEmpty(HTTP_STATUS.TOO_EARLY);
  }
  return undefined;
};

const resolveGoLiveTenant = async ({
  tenantId,
  postId,
}: TGoLiveRequest): Promise<TTenant | NextResponse> => {
  let tenant: TMaybeUndefined<TTenant>;
  try {
    tenant = await resolveTenantById(tenantId);
  } catch (error) {
    logger.error(GENERATE_SKIM_LOG.TENANT_RESOLVE_FAILED, {
      tenantId,
      postId,
      error,
    });
    return respondEmpty(HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
  if (!tenant) {
    logger.warn(GENERATE_SKIM_LOG.TENANT_NOT_SERVABLE, { tenantId, postId });
    return respondEmpty(HTTP_STATUS.NOT_FOUND);
  }
  return tenant;
};

export async function POST(request: Request): Promise<NextResponse> {
  const signed = await readSignedTenantRequest(request, requestBodySchema, {
    secret: env.SANITY_REVALIDATE_SECRET,
    log: {
      SECRET_MISSING: GENERATE_SKIM_LOG.GO_LIVE_SECRET_MISSING,
      TENANT_LOOKUP_FAILED: GENERATE_SKIM_LOG.GO_LIVE_TENANT_LOOKUP_FAILED,
    },
  });
  if ('refusal' in signed) {
    return signed.refusal;
  }
  const { body, tenant: readTenant } = signed;
  const { tenantId, postId } = body;

  const { ANTHROPIC_API_KEY: apiKey } = env;
  if (!apiKey) {
    logger.error(GENERATE_SKIM_LOG.CONFIG_MISSING, { tenantId, postId });
    return respondEmpty(HTTP_STATUS.SERVICE_UNAVAILABLE);
  }

  const notDue = await refuseUnlessGoingLive(body, readTenant);
  if (notDue) return notDue;

  const tenant = await resolveGoLiveTenant(body);
  if (tenant instanceof NextResponse) return tenant;
  const writeContext = toTenantSanityWriteContext(tenant);

  const existing = await hasExistingTakeaways(postId, writeContext);
  if (!existing.ok) {
    return respondEmpty(HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
  if (existing.data) {
    return respondEmpty(HTTP_STATUS.NO_CONTENT);
  }

  const result = await generatePostSkim({
    postId,
    apiKey,
    readTenant,
    writeContext,
  });
  if (!result.isGenerated) {
    return skimResponse(result.message, result.status);
  }

  return NextResponse.json(
    { ok: true, count: result.count },
    { status: HTTP_STATUS.OK },
  );
}
