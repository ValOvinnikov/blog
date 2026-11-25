import { HTTP_STATUS } from '@shinefold/config/constants';
import { sanitizeLogMessage } from '@shinefold/insight';
import { ENQUEUE_ERROR } from '@worker/constants/enqueue-error';
import { env } from '@worker/utils/env/env';
import { logger } from '@worker/utils/logger/logger';
import {
  readSignedRequest,
  refuseUnwritableTenant,
  respondError,
  type TWriteRefusalOptions,
} from '@worker/utils/signed-tenant-request/signed-tenant-request';
import type { z } from 'zod';

type TSignedTenantRequestBody = { tenantId: string };

type TSignedTenantRequestHandler<TBody extends TSignedTenantRequestBody> = {
  schema: z.ZodType<TBody>;
  failureEvent: string;
  refusal?: TWriteRefusalOptions;
  run: (body: TBody) => Promise<Response>;
};

export async function handleSignedTenantRequest<
  TBody extends TSignedTenantRequestBody,
>(
  request: Request,
  handler: TSignedTenantRequestHandler<TBody>,
): Promise<Response> {
  const { schema, failureEvent, refusal, run } = handler;
  const signed = await readSignedRequest(
    request,
    schema,
    env.WORKER_ENQUEUE_SECRET,
  );
  if (!signed.ok) return signed.error;
  const body = signed.data;

  try {
    const refused = await refuseUnwritableTenant(body.tenantId, refusal);
    if (refused) return refused;

    return await run(body);
  } catch (error) {
    logger.error(failureEvent, { ...body, error: sanitizeLogMessage(error) });
    return respondError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ENQUEUE_ERROR.SERVER_ERROR,
    );
  }
}
