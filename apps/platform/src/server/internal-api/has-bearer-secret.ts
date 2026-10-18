import { isSecretMatch } from '@blog/utils';

const BEARER_PREFIX = 'Bearer ';

export const hasBearerSecret = (request: Request, secret: string): boolean => {
  const authHeader = request.headers.get('authorization');
  const providedSecret = authHeader?.startsWith(BEARER_PREFIX)
    ? authHeader.slice(BEARER_PREFIX.length)
    : null;

  return isSecretMatch(providedSecret, secret);
};
