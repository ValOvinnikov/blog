import { HTTP_STATUS, type TMaybeUndefined } from '@shinefold/config';
import {
  getPlatformSanityWriteContext,
  service,
  type TTenantSanityContext,
} from '@shinefold/service';
import { isSecretMatch } from '@shinefold/utils';
import { GENERATE_SKIM_LOG } from '@web/constants/generate-skim';
import {
  generateTakeaways,
  SKIM_GENERATION_MODEL,
} from '@web/server/skim/generate-takeaways/generate-takeaways';
import { skimResponse } from '@web/server/skim/skim-response/skim-response';
import {
  gateSkimWrite,
  releaseSkimGeneration,
  UNRESOLVED_TENANT_MESSAGE,
} from '@web/server/skim/skim-write-gate/skim-write-gate';
import { getHostTenantSanityContext } from '@web/server/tenant/tenant-sanity-context/tenant-sanity-context';
import { env } from '@web/utils/env/env';
import { logger } from '@web/utils/logger/logger';
import { NextResponse } from 'next/server';
import { z } from 'zod';

// The Sanity write client needs the Node.js runtime.
export const runtime = 'nodejs';

const requestBodySchema = z.object({ _id: z.string().min(1) });

const SAVE_FAILED_MESSAGE = 'Failed to save the skim draft.';

const parsePostId = async (
  request: Request,
): Promise<TMaybeUndefined<string>> => {
  try {
    const parsedBody = requestBodySchema.safeParse(await request.json());
    return parsedBody.success ? parsedBody.data._id : undefined;
  } catch {
    return undefined;
  }
};

export async function POST(request: Request): Promise<NextResponse> {
  const { SANITY_GENERATE_SECRET: secret, ANTHROPIC_API_KEY: apiKey } = env;

  if (!secret || !apiKey) {
    logger.error(GENERATE_SKIM_LOG.CONFIG_MISSING);
    return skimResponse(
      'Skim generation is not configured.',
      HTTP_STATUS.SERVICE_UNAVAILABLE,
    );
  }

  const providedSecret = new URL(request.url).searchParams.get('secret');
  if (!isSecretMatch(providedSecret, secret)) {
    return skimResponse('Invalid secret.', HTTP_STATUS.UNAUTHORIZED);
  }

  const postId = await parsePostId(request);
  if (!postId) {
    return skimResponse('Malformed request body.', HTTP_STATUS.BAD_REQUEST);
  }

  const hostTenant = await getHostTenantSanityContext();
  if (!hostTenant.isResolvable) {
    logger.error(GENERATE_SKIM_LOG.HOST_UNRESOLVABLE, { postId });
    return skimResponse(UNRESOLVED_TENANT_MESSAGE, HTTP_STATUS.NOT_FOUND);
  }

  const gate = await gateSkimWrite(postId);
  if (!gate.isAllowed) {
    return gate.response;
  }
  const { tenant: writeTenant, claim } = gate;

  const bodyResult = await service.editorial.skim.v1.getPublishedPostBody(
    postId,
    hostTenant.tenant,
  );
  if (!bodyResult.ok) {
    logger.error(GENERATE_SKIM_LOG.POST_BODY_FETCH_FAILED, {
      postId,
      error: bodyResult.error,
    });
    await releaseSkimGeneration(claim, postId);
    return skimResponse(
      'Failed to read the published post.',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
    );
  }

  let takeaways: string[];
  try {
    takeaways = await generateTakeaways(bodyResult.data, apiKey);
  } catch (error) {
    logger.error(GENERATE_SKIM_LOG.GENERATION_FAILED, { postId, error });
    await releaseSkimGeneration(claim, postId);
    return skimResponse(
      'Failed to generate takeaways.',
      HTTP_STATUS.UNPROCESSABLE_ENTITY,
    );
  }

  let resolvedWriteTenant: TTenantSanityContext;
  try {
    resolvedWriteTenant = writeTenant ?? getPlatformSanityWriteContext();
  } catch (error) {
    logger.error(GENERATE_SKIM_LOG.WRITE_CLIENT_UNCONFIGURED, {
      postId,
      error,
    });
    return skimResponse(SAVE_FAILED_MESSAGE, HTTP_STATUS.SERVICE_UNAVAILABLE);
  }

  const saveResult = await service.editorial.skim.v1.saveSkimDraft(
    { postId, takeaways, model: SKIM_GENERATION_MODEL },
    resolvedWriteTenant,
  );
  if (!saveResult.ok) {
    logger.error(GENERATE_SKIM_LOG.DRAFT_SAVE_FAILED, {
      postId,
      error: saveResult.error,
    });
    return skimResponse(SAVE_FAILED_MESSAGE, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }

  return NextResponse.json(
    { ok: true, count: takeaways.length },
    { status: HTTP_STATUS.OK },
  );
}
