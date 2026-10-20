import { createHmac } from 'node:crypto';

import { ENQUEUE_SIGNATURE_PREFIX } from '@worker/constants/enqueue';

export function signEnqueuePayload(input: {
  secret: string;
  timestamp: string;
  rawBody: string;
}): string {
  const { secret, timestamp, rawBody } = input;
  const digest = createHmac('sha256', secret)
    .update(`${timestamp}.${rawBody}`)
    .digest('hex');
  return `${ENQUEUE_SIGNATURE_PREFIX}${digest}`;
}
