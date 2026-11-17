import { HTTP_STATUS } from '@shinefold/config/constants';
import { service, type TTenantSanityContext } from '@shinefold/service';
import { GENERATE_SKIM_LOG } from '@web/constants/generate-skim';
import { readSignedTenantRequest } from '@web/server/signed-request/read-signed-tenant-request/read-signed-tenant-request';
import { generatePostSkim } from '@web/server/skim/generate-post-skim/generate-post-skim';
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

const LOOKUP_FAILED = { isLookupFailed: true } as const;

const isGoingLiveNow = async (
  { tenantId, postId, publishedAt }: TGoLiveRequest,
  readTenant: TTenantSanityContext,
): Promise<boolean | typeof LOOKUP_FAILED> => {
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
    return LOOKUP_FAILED;
  }
  const { data: currentPublishedAt } = result;
  if (!currentPublishedAt) return false;

  const goLiveMs = Date.parse(publishedAt);
  return Date.parse(currentPublishedAt) === goLiveMs && goLiveMs <= Date.now();
};

const hasTakeaways = async (
  { tenantId, postId }: TGoLiveRequest,
  writeTenant: TTenantSanityContext,
): Promise<boolean | typeof LOOKUP_FAILED> => {
  const result = await service.editorial.skim.v1.hasPostTakeaways(
    postId,
    writeTenant,
  );
  if (result.ok) return result.data;

  logger.error(GENERATE_SKIM_LOG.TAKEAWAYS_LOOKUP_FAILED, {
    tenantId,
    postId,
    error: result.error,
  });
  return LOOKUP_FAILED;
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

  const isDue = await isGoingLiveNow(body, readTenant);
  if (isDue === LOOKUP_FAILED) {
    return respondEmpty(HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
  if (!isDue) {
    return respondEmpty(HTTP_STATUS.NO_CONTENT);
  }

  const tenant = await resolveTenantById(tenantId);
  if (!tenant) {
    return respondEmpty(HTTP_STATUS.NOT_FOUND);
  }
  const writeContext = toTenantSanityWriteContext(tenant);

  if (writeContext.tenant) {
    const isDone = await hasTakeaways(body, writeContext.tenant);
    if (isDone === LOOKUP_FAILED) {
      return respondEmpty(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
    if (isDone) {
      return respondEmpty(HTTP_STATUS.NO_CONTENT);
    }
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
