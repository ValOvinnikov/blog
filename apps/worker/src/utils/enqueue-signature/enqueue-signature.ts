import { createHmac, timingSafeEqual } from 'node:crypto';

import type { TMaybeNull } from '@blog/config';
import {
  ENQUEUE_MAX_AGE_MS,
  ENQUEUE_SIGNATURE_ALGORITHM,
  ENQUEUE_SIGNATURE_PREFIX,
} from '@worker/constants/enqueue';

function signEnqueuePayload(input: {
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

export function isValidEnqueueSignature(input: {
  secret: string;
  timestamp: TMaybeNull<string>;
  signature: TMaybeNull<string>;
  rawBody: string;
  now?: number;
}): boolean {
  const { secret, timestamp, signature, rawBody, now = Date.now() } = input;
  if (!timestamp || !signature) return false;

  const sentAt = Number(timestamp);
  if (!Number.isSafeInteger(sentAt)) return false;
  if (Math.abs(now - sentAt) > ENQUEUE_MAX_AGE_MS) return false;

  const expected = Buffer.from(
    signEnqueuePayload({ secret, timestamp, rawBody }),
  );
  const received = Buffer.from(signature);
  return (
    expected.length === received.length && timingSafeEqual(expected, received)
  );
}
