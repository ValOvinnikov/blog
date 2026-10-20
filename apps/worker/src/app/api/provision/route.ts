import { ERROR_CODE, HTTP_STATUS } from '@blog/config/constants';
import type { TValueOf } from '@blog/config/utils';
import { beginTenantProvisioning } from '@blog/db/queries/tenants';
import { sanitizeLogMessage } from '@blog/insight';
import {
  ENQUEUE_SIGNATURE_HEADER,
  ENQUEUE_TIMESTAMP_HEADER,
} from '@worker/constants/enqueue';
import { ENQUEUE_ERROR } from '@worker/constants/enqueue-error';
import { isValidEnqueueSignature } from '@worker/utils/enqueue-signature/enqueue-signature';
import { env } from '@worker/utils/env/env';
import { logger } from '@worker/utils/logger/logger';
import { markRunNotStarted } from '@worker/utils/provisioning-report/provisioning-report';
import { provisionTenant } from '@worker/workflows/provision-tenant';
import { start } from 'workflow/api';
import { z } from 'zod';

const enqueueBodySchema = z.object({ tenantId: z.uuid() });

function respond(
  status: TValueOf<typeof HTTP_STATUS>,
  body: Record<string, string>,
): Response {
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
    return respond(HTTP_STATUS.UNAUTHORIZED, {
      error: ENQUEUE_ERROR.UNAUTHORIZED,
    });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return respond(HTTP_STATUS.BAD_REQUEST, {
      error: ENQUEUE_ERROR.INVALID_BODY,
    });
  }
  const parsed = enqueueBodySchema.safeParse(payload);
  if (!parsed.success) {
    return respond(HTTP_STATUS.BAD_REQUEST, {
      error: ENQUEUE_ERROR.INVALID_BODY,
    });
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
    return respond(HTTP_STATUS.INTERNAL_SERVER_ERROR, {
      error: ENQUEUE_ERROR.SERVER_ERROR,
    });
  }
  if (!began.ok) {
    if (began.error === ERROR_CODE.DB_ALREADY_PROVISIONING) {
      return respond(HTTP_STATUS.CONFLICT, {
        error: ENQUEUE_ERROR.ALREADY_IN_PROGRESS,
      });
    }
    if (began.error === ERROR_CODE.DB_NOT_FOUND) {
      return respond(HTTP_STATUS.NOT_FOUND, { error: ENQUEUE_ERROR.NOT_FOUND });
    }
    logger.error('provisioning.begin_failed', { tenantId, error: began.error });
    return respond(HTTP_STATUS.INTERNAL_SERVER_ERROR, {
      error: ENQUEUE_ERROR.SERVER_ERROR,
    });
  }

  try {
    const run = await start(provisionTenant, [tenantId]);
    return respond(HTTP_STATUS.ACCEPTED, { runId: run.runId });
  } catch (error) {
    logger.error('provisioning.start_failed', {
      tenantId,
      error: sanitizeLogMessage(error),
    });
    await markRunNotStarted(tenantId);
    return respond(HTTP_STATUS.INTERNAL_SERVER_ERROR, {
      error: ENQUEUE_ERROR.SERVER_ERROR,
    });
  }
}
