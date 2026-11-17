import { HTTP_STATUS, type TMaybeUndefined } from '@shinefold/config';
import { isSecretMatch } from '@shinefold/utils';
import { GENERATE_SKIM_LOG } from '@web/constants/generate-skim';
import { generatePostSkim } from '@web/server/skim/generate-post-skim/generate-post-skim';
import { skimResponse } from '@web/server/skim/skim-response/skim-response';
import {
  getHostTenantSanityContext,
  getHostTenantSanityWriteContext,
} from '@web/server/tenant/tenant-sanity-context/tenant-sanity-context';
import { env } from '@web/utils/env/env';
import { logger } from '@web/utils/logger/logger';
import { NextResponse } from 'next/server';
import { z } from 'zod';

// The Sanity write client needs the Node.js runtime.
export const runtime = 'nodejs';

const requestBodySchema = z.object({ _id: z.string().min(1) });

const UNRESOLVED_TENANT_MESSAGE = 'Failed to resolve the requesting tenant.';

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

  const writeContext = await getHostTenantSanityWriteContext();
  if (!writeContext.isResolvable) {
    logger.error(GENERATE_SKIM_LOG.WRITE_TENANT_UNRESOLVABLE, { postId });
    return skimResponse(UNRESOLVED_TENANT_MESSAGE, HTTP_STATUS.NOT_FOUND);
  }

  const result = await generatePostSkim({
    postId,
    apiKey,
    readTenant: hostTenant.tenant,
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
