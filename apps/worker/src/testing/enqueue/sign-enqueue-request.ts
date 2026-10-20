import { HTTP_METHOD } from '@blog/config/constants';
import { buildEnqueueHeaders } from '@blog/utils/enqueue-signature';

export function signedRequest(
  url: string,
  rawBody: string,
  options: { secret: string; timestamp?: number },
): Request {
  const { secret, timestamp } = options;
  return new Request(url, {
    method: HTTP_METHOD.POST,
    headers: buildEnqueueHeaders({
      secret,
      path: new URL(url).pathname,
      rawBody,
      ...(timestamp === undefined ? {} : { now: timestamp }),
    }),
    body: rawBody,
  });
}
