import { createHmac } from 'node:crypto';

import {
  ENQUEUE_SIGNATURE_ALGORITHM,
  ENQUEUE_SIGNATURE_PREFIX,
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
