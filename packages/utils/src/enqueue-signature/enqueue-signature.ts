import { createHmac, timingSafeEqual } from 'node:crypto';

import { HMAC_ALGORITHM } from '@blog/utils/encryption';

export const ENQUEUE_SIGNATURE_HEADER = 'x-worker-signature';
export const ENQUEUE_TIMESTAMP_HEADER = 'x-worker-timestamp';
export const ENQUEUE_MAX_AGE_MS = 5 * 60_000;

const ENQUEUE_SIGNATURE_PREFIX = `${HMAC_ALGORITHM}=`;

interface IEnqueuePayload {
  secret: string;
  timestamp: string;
  path: string;
  rawBody: string;
}

export function signEnqueuePayload({
  secret,
  timestamp,
  path,
  rawBody,
}: IEnqueuePayload): string {
  const digest = createHmac(HMAC_ALGORITHM, secret)
    .update(`${timestamp}.${path}.${rawBody}`)
    .digest('hex');
  return `${ENQUEUE_SIGNATURE_PREFIX}${digest}`;
}

export function buildEnqueueHeaders({
  secret,
  path,
  rawBody,
  now = Date.now(),
}: Omit<IEnqueuePayload, 'timestamp'> & { now?: number }): Record<
  string,
  string
> {
  const timestamp = String(now);
  return {
    [ENQUEUE_TIMESTAMP_HEADER]: timestamp,
    [ENQUEUE_SIGNATURE_HEADER]: signEnqueuePayload({
      secret,
      timestamp,
      path,
      rawBody,
    }),
  };
}

export function isValidEnqueueSignature({
  secret,
  timestamp,
  signature,
  path,
  rawBody,
  now = Date.now(),
}: Omit<IEnqueuePayload, 'timestamp'> & {
  timestamp: string | null;
  signature: string | null;
  now?: number;
}): boolean {
  if (!timestamp || !signature) return false;

  const sentAt = Number(timestamp);
  if (!Number.isSafeInteger(sentAt)) return false;
  if (Math.abs(now - sentAt) > ENQUEUE_MAX_AGE_MS) return false;

  const expected = Buffer.from(
    signEnqueuePayload({ secret, timestamp, path, rawBody }),
  );
  const received = Buffer.from(signature);
  return (
    expected.length === received.length && timingSafeEqual(expected, received)
  );
}
