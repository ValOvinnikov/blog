import { isSecretMatch } from '@shinefold/utils';
import { BEARER_PREFIX } from '@worker/constants/bearer';

export function hasBearerSecret(request: Request, secret: string): boolean {
  const authorization = request.headers.get('authorization');
  const provided = authorization?.startsWith(BEARER_PREFIX)
    ? authorization.slice(BEARER_PREFIX.length)
    : null;
  return isSecretMatch(provided, secret);
}
