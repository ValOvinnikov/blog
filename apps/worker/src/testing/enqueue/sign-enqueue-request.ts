import { createHmac } from 'node:crypto';

import { HTTP_METHOD } from '@blog/config/constants';
import {
  ENQUEUE_SIGNATURE_ALGORITHM,
  ENQUEUE_SIGNATURE_HEADER,
  ENQUEUE_SIGNATURE_PREFIX,
  ENQUEUE_TIMESTAMP_HEADER,
} from '@worker/constants/enqueue';

export function signEnqueuePayload(input: {
  secret: string;
  timestamp: string;
  rawBody: string;
}): string {
  const { secret, timestamp, rawBody } = input;
  const digest = createHmac(ENQUEUE_SIGNATURE_ALGORITHM, secret)
    .update(`${timestamp}.${rawBody}`)
    .digest('hex');
  return `${ENQUEUE_SIGNATURE_PREFIX}${digest}`;
}

export function signedRequest(
  url: string,
  rawBody: string,
  options: { secret: string; timestamp?: number },
): Request {
  const { secret, timestamp = Date.now() } = options;
  const signature = signEnqueuePayload({
    secret,
    timestamp: String(timestamp),
    rawBody,
  });
  return new Request(url, {
    method: HTTP_METHOD.POST,
    headers: {
      [ENQUEUE_TIMESTAMP_HEADER]: String(timestamp),
      [ENQUEUE_SIGNATURE_HEADER]: signature,
    },
    body: rawBody,
  });
}
