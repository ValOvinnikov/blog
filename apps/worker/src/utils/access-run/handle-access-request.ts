import { HTTP_STATUS } from '@shinefold/config/constants';
import { getTenantById } from '@shinefold/db/queries/tenants';
import { sanitizeLogMessage } from '@shinefold/insight';
import { ENQUEUE_ERROR } from '@worker/constants/enqueue-error';
import { env } from '@worker/utils/env/env';
import { logger } from '@worker/utils/logger/logger';
import {
  readSignedRequest,
  respond,
  respondError,
} from '@worker/utils/signed-tenant-request/signed-tenant-request';
import type { z } from 'zod';

type TAccessRequestBody = { tenantId: string };

export type TAccessRequestHandler<TBody extends TAccessRequestBody> = {
  schema: z.ZodType<TBody>;
  failureEvent: string;
  wake: (body: TBody) => Promise<void>;
  exists?: (body: TBody) => Promise<boolean>;
  before?: (body: TBody) => Promise<void>;
  logContext?: (body: TBody) => Record<string, string>;
};

export async function handleAccessRequest<TBody extends TAccessRequestBody>(
  request: Request,
  handler: TAccessRequestHandler<TBody>,
): Promise<Response> {
  const { schema, failureEvent, wake, exists, before, logContext } = handler;
  const signed = await readSignedRequest(
    request,
    schema,
    env.WORKER_ENQUEUE_SECRET,
  );
  if (!signed.ok) return signed.error;
  const body = signed.data;

  try {
    const tenant = await getTenantById(body.tenantId);
    if (!tenant || (exists && !(await exists(body)))) {
      return respondError(HTTP_STATUS.NOT_FOUND, ENQUEUE_ERROR.NOT_FOUND);
    }
    if (!tenant.sanityProjectId) {
      return respondError(HTTP_STATUS.CONFLICT, ENQUEUE_ERROR.NOT_PROVISIONED);
    }

    await before?.(body);
    await wake(body);
    return respond(HTTP_STATUS.ACCEPTED, {});
  } catch (error) {
    logger.error(failureEvent, {
      tenantId: body.tenantId,
      ...logContext?.(body),
      error: sanitizeLogMessage(error),
    });
    return respondError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ENQUEUE_ERROR.SERVER_ERROR,
    );
  }
}
