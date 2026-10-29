import { isSecretMatch } from '@blog/utils';
import { CRON_BEARER_PREFIX } from '@worker/constants/cron';

export function hasCronSecret(request: Request, secret: string): boolean {
  const authorization = request.headers.get('authorization');
  const provided = authorization?.startsWith(CRON_BEARER_PREFIX)
    ? authorization.slice(CRON_BEARER_PREFIX.length)
    : null;
  return isSecretMatch(provided, secret);
}
