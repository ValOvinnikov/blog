import { HTTP_STATUS, type THttpStatus } from '@blog/config/constants';
import {
  ENQUEUE_SIGNATURE_HEADER,
  ENQUEUE_TIMESTAMP_HEADER,
  isValidEnqueueSignature,
} from '@blog/utils/enqueue-signature';
import { errorResult, okResult, type TResult } from '@blog/utils/result';
import {
  ENQUEUE_ERROR,
  type TEnqueueError,
} from '@worker/constants/enqueue-error';
import { env } from '@worker/utils/env/env';
import { z } from 'zod';

const tenantRequestBodySchema = z.object({ tenantId: z.uuid() });

export function respond(
  status: THttpStatus,
  body: Record<string, string>,
): Response {
  return Response.json(body, { status });
}

export function respondError(
  status: THttpStatus,
  error: TEnqueueError,
): Response {
  return respond(status, { error });
}

function reject(status: THttpStatus, error: TEnqueueError) {
  return errorResult(respondError(status, error));
}

export async function readSignedTenantRequest(
  request: Request,
): Promise<TResult<string, Response>> {
  const secret = env.WORKER_ENQUEUE_SECRET;
  const rawBody = await request.text();

  const authenticated =
    secret !== undefined &&
    isValidEnqueueSignature({
      secret,
      timestamp: request.headers.get(ENQUEUE_TIMESTAMP_HEADER),
      signature: request.headers.get(ENQUEUE_SIGNATURE_HEADER),
      path: new URL(request.url).pathname,
      rawBody,
    });
  if (!authenticated) {
    return reject(HTTP_STATUS.UNAUTHORIZED, ENQUEUE_ERROR.UNAUTHORIZED);
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return reject(HTTP_STATUS.BAD_REQUEST, ENQUEUE_ERROR.INVALID_BODY);
  }
  const parsed = tenantRequestBodySchema.safeParse(payload);
  if (!parsed.success) {
    return reject(HTTP_STATUS.BAD_REQUEST, ENQUEUE_ERROR.INVALID_BODY);
  }
  return okResult(parsed.data.tenantId);
}
