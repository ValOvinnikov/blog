import { HTTP_STATUS, type TMaybeUndefined } from '@shinefold/config';
import type { TTenant } from '@shinefold/db/schema/tenants';
import { GENERATE_SKIM_LOG } from '@web/constants/generate-skim';
import { readSignedTenantRequest } from '@web/server/signed-request/read-signed-tenant-request/read-signed-tenant-request';
import { generatePostSkim } from '@web/server/skim/generate-post-skim/generate-post-skim';
import { hasExistingTakeaways } from '@web/server/skim/has-existing-takeaways/has-existing-takeaways';
import { refuseUnlessGoingLive } from '@web/server/skim/refuse-unless-going-live/refuse-unless-going-live';
import { skimResponse } from '@web/server/skim/skim-response/skim-response';
import { resolveTenantById } from '@web/server/tenant/resolve-tenant/resolve-tenant';
import { toTenantSanityWriteContext } from '@web/server/tenant/tenant-sanity-context/tenant-sanity-context';
import { respondEmpty } from '@web/utils/empty-response/empty-response';
import { env } from '@web/utils/env/env';
import { logger } from '@web/utils/logger/logger';
import { NextResponse } from 'next/server';
import { z } from 'zod';

export const runtime = 'nodejs';
// Below the worker's 90s call timeout, so a retry never overlaps a call still generating; route segment config must be a literal.
export const maxDuration = 80;

const requestBodySchema = z.object({
  tenantId: z.uuid(),
  postId: z.string().min(1),
  publishedAt: z.string().min(1),
});

type TGoLiveRequest = z.infer<typeof requestBodySchema>;

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
