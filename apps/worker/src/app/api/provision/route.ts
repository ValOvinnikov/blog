import { ERROR_CODE } from '@blog/config/constants';
import { beginTenantProvisioning } from '@blog/db/queries/tenants';
import { sanitizeLogMessage } from '@blog/insight';
import {
  ENQUEUE_SIGNATURE_HEADER,
  ENQUEUE_TIMESTAMP_HEADER,
} from '@worker/constants/enqueue';
import { isValidEnqueueSignature } from '@worker/utils/enqueue-signature/enqueue-signature';
import { env } from '@worker/utils/env/env';
import { logger } from '@worker/utils/logger/logger';
import { markRunNotStarted } from '@worker/utils/provisioning-report/provisioning-report';
import { provisionTenant } from '@worker/workflows/provision-tenant';
import { start } from 'workflow/api';
import { z } from 'zod';

const enqueueBodySchema = z.object({ tenantId: z.uuid() });

function respond(status: number, body: Record<string, string>): Response {
  return Response.json(body, { status });
}

export async function POST(request: Request): Promise<Response> {
  const secret = env.WORKER_ENQUEUE_SECRET;
  const rawBody = await request.text();

  const authenticated =
    secret !== undefined &&
    isValidEnqueueSignature({
      secret,
      timestamp: request.headers.get(ENQUEUE_TIMESTAMP_HEADER),
      signature: request.headers.get(ENQUEUE_SIGNATURE_HEADER),
      rawBody,
    });
  if (!authenticated) {
    return respond(401, { error: 'UNAUTHORIZED' });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return respond(400, { error: 'INVALID_BODY' });
  }
  const parsed = enqueueBodySchema.safeParse(payload);
  if (!parsed.success) {
    return respond(400, { error: 'INVALID_BODY' });
  }
  const { tenantId } = parsed.data;

  let began: Awaited<ReturnType<typeof beginTenantProvisioning>>;
  try {
    began = await beginTenantProvisioning(tenantId);
  } catch (error) {
    logger.error('provisioning.begin_failed', {
      tenantId,
      error: sanitizeLogMessage(error),
    });
    return respond(500, { error: 'SERVER_ERROR' });
  }
  if (!began.ok) {
    if (began.error === ERROR_CODE.DB_ALREADY_PROVISIONING) {
      return respond(409, { error: 'ALREADY_IN_PROGRESS' });
    }
    if (began.error === ERROR_CODE.DB_NOT_FOUND) {
      return respond(404, { error: 'NOT_FOUND' });
    }
    logger.error('provisioning.begin_failed', { tenantId, error: began.error });
    return respond(500, { error: 'SERVER_ERROR' });
  }

  try {
    const run = await start(provisionTenant, [tenantId]);
    return respond(202, { runId: run.runId });
  } catch (error) {
    logger.error('provisioning.start_failed', {
      tenantId,
      error: sanitizeLogMessage(error),
    });
    await markRunNotStarted(tenantId);
    return respond(500, { error: 'SERVER_ERROR' });
  }
}
