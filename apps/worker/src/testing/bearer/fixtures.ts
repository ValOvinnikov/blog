import { BEARER_PREFIX } from '@worker/constants/bearer';

export function bearerRequest(url: string, secret: string): Request {
  return new Request(url, {
    headers: { Authorization: `${BEARER_PREFIX}${secret}` },
  });
}
