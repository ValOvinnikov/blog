import type { TMaybeUndefined } from '@blog/config';
import { SIGN_IN_ERROR, type TSignInError } from '@platform/constants/sign-in';

export const ACCOUNT_NOT_LINKED_AUTH_ERROR = 'OAuthAccountNotLinked';

export const toSignInError = (
  authError: TMaybeUndefined<string>,
): TMaybeUndefined<TSignInError> => {
  if (!authError) return undefined;

  return authError === ACCOUNT_NOT_LINKED_AUTH_ERROR
    ? SIGN_IN_ERROR.ACCOUNT_NOT_LINKED
    : SIGN_IN_ERROR.SIGN_IN_FAILED;
};
