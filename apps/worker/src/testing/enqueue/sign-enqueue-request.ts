import { createHmac } from 'node:crypto';

export function signEnqueuePayload(input: {
  secret: string;
  timestamp: string;
  rawBody: string;
}): string {
  const { secret, timestamp, rawBody } = input;
  const digest = createHmac('sha256', secret)
    .update(`${timestamp}.${rawBody}`)
    .digest('hex');
  return `sha256=${digest}`;
}
