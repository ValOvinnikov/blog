import {
  getPlatformSanityWriteContext,
  service,
  type TTenantSanityContext,
} from '@blog/service';
import { isSecretMatch } from '@blog/utils';
import {
  generateTakeaways,
  SKIM_GENERATION_MODEL,
} from '@web/server/skim/generate-takeaways';
import { getHostTenantSanityContext } from '@web/server/tenant/get-host-tenant-sanity-context';
import { getHostTenantSanityWriteContext } from '@web/server/tenant/get-host-tenant-sanity-write-context';
import { env } from '@web/utils/env/env';
import { logger } from '@web/utils/logger/logger';
import { NextResponse } from 'next/server';
import { z } from 'zod';

// The Sanity write client (via `service.editorial.skim.v1.saveSkimDraft`)
// needs the Node.js runtime, same reason as `/api/revalidate`.
export const runtime = 'nodejs';

const requestBodySchema = z.object({ _id: z.string().min(1) });

export async function POST(request: Request): Promise<NextResponse> {
  const { SANITY_GENERATE_SECRET: secret, ANTHROPIC_API_KEY: apiKey } = env;

  if (!secret || !apiKey) {
    logger.error('generate_skim.config_missing');
    return NextResponse.json(
      { message: 'Skim generation is not configured.' },
      { status: 503 },
    );
  }

  const providedSecret = new URL(request.url).searchParams.get('secret');
  if (!isSecretMatch(providedSecret, secret)) {
    return NextResponse.json({ message: 'Invalid secret.' }, { status: 401 });
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json(
      { message: 'Malformed request body.' },
      { status: 400 },
    );
  }

  const parsedBody = requestBodySchema.safeParse(rawBody);
  if (!parsedBody.success) {
    return NextResponse.json(
      { message: 'Malformed request body.' },
      { status: 400 },
    );
  }
  const { _id: postId } = parsedBody.data;

  const hostTenant = await getHostTenantSanityContext();
  if (!hostTenant.isResolvable) {
    logger.error('generate_skim.host_unresolvable', { postId });
    return NextResponse.json(
      { message: 'Failed to resolve the requesting tenant.' },
      { status: 404 },
    );
  }

  const writeTenant = await getHostTenantSanityWriteContext();
  if (!writeTenant.isResolvable) {
    logger.error('generate_skim.write_tenant_unresolvable', { postId });
    return NextResponse.json(
      { message: 'Failed to resolve the requesting tenant.' },
      { status: 404 },
    );
  }
  if (writeTenant.tenantId && !writeTenant.tenant) {
    logger.error('generate_skim.tenant_write_credentials_missing', {
      postId,
      tenantId: writeTenant.tenantId,
    });
    return NextResponse.json(
      {
        message:
          'The requesting tenant has no usable Sanity write credentials.',
      },
      { status: 503 },
    );
  }
  if (writeTenant.tenantId && !writeTenant.isActive) {
    logger.warn('generate_skim.tenant_not_active', {
      postId,
      tenantId: writeTenant.tenantId,
    });
    return NextResponse.json(
      { message: 'The requesting tenant is not permitted to write.' },
      { status: 403 },
    );
  }

  const bodyResult = await service.editorial.skim.v1.getPublishedPostBody(
    postId,
    hostTenant.tenant,
  );
  if (!bodyResult.ok) {
    logger.error('generate_skim.post_body_fetch_failed', {
      postId,
      error: bodyResult.error,
    });
    return NextResponse.json(
      { message: 'Failed to read the published post.' },
      { status: 500 },
    );
  }

  let takeaways: string[];
  try {
    takeaways = await generateTakeaways(bodyResult.data, apiKey);
  } catch (error) {
    logger.error('generate_skim.generation_failed', { postId, error });
    return NextResponse.json(
      { message: 'Failed to generate takeaways.' },
      { status: 422 },
    );
  }

  let resolvedWriteTenant: TTenantSanityContext;
  try {
    resolvedWriteTenant = writeTenant.tenant ?? getPlatformSanityWriteContext();
  } catch (error) {
    logger.error('generate_skim.write_client_unconfigured', {
      postId,
      error,
    });
    return NextResponse.json(
      { message: 'Failed to save the skim draft.' },
      { status: 503 },
    );
  }

  const saveResult = await service.editorial.skim.v1.saveSkimDraft(
    {
      postId,
      takeaways,
      model: SKIM_GENERATION_MODEL,
    },
    resolvedWriteTenant,
  );
  if (!saveResult.ok) {
    logger.error('generate_skim.draft_save_failed', {
      postId,
      error: saveResult.error,
    });
    return NextResponse.json(
      { message: 'Failed to save the skim draft.' },
      { status: 500 },
    );
  }

  return NextResponse.json(
    { ok: true, count: takeaways.length },
    { status: 200 },
  );
}
