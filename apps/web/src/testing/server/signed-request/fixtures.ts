import { HTTP_METHOD } from '@shinefold/config/constants';
import { buildEnqueueHeaders } from '@shinefold/utils/enqueue-signature';
import { isUndefined } from '@shinefold/utils/primitives';

export type TMockSignedRequestInput = {
  url: string;
  secret: string;
  rawBody: string;
  path?: string;
  now?: number;
};

export const mockSignedRequest = ({
  url,
  secret,
  rawBody,
  path = new URL(url).pathname,
  now,
}: TMockSignedRequestInput): Request =>
  new Request(url, {
    method: HTTP_METHOD.POST,
    headers: buildEnqueueHeaders({
      secret,
      path,
      rawBody,
      ...(isUndefined(now) ? {} : { now }),
    }),
    body: rawBody,
  });
