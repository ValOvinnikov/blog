import type { TMaybeUndefined } from '@blog/config';
import {
  ENQUEUE_SIGNATURE_HEADER,
  ENQUEUE_TIMESTAMP_HEADER,
  isValidEnqueueSignature,
} from '@blog/utils/enqueue-signature';

export const readSignedRequestBody = async (
  request: Request,
  secret: string,
): Promise<TMaybeUndefined<string>> => {
  const rawBody = await request.text();
  const isSigned = isValidEnqueueSignature({
    secret,
    timestamp: request.headers.get(ENQUEUE_TIMESTAMP_HEADER),
    signature: request.headers.get(ENQUEUE_SIGNATURE_HEADER),
    path: new URL(request.url).pathname,
    rawBody,
  });
  return isSigned ? rawBody : undefined;
};
