import { SIGN_IN_ERROR } from '@platform/constants/sign-in';

import { ACCOUNT_NOT_LINKED_AUTH_ERROR, toSignInError } from './sign-in-error';

describe(toSignInError, () => {
  it('reports no error when Auth.js sent none', () => {
    expect(toSignInError(undefined)).toBeUndefined();
  });

  it('names an email already linked to another provider', () => {
    expect(toSignInError(ACCOUNT_NOT_LINKED_AUTH_ERROR)).toBe(
      SIGN_IN_ERROR.ACCOUNT_NOT_LINKED,
    );
  });

  it.each(['OAuthCallbackError', 'MissingCSRF'])(
    'reports %s as a failed sign-in',
    (authError) => {
      expect(toSignInError(authError)).toBe(SIGN_IN_ERROR.SIGN_IN_FAILED);
    },
  );
});
