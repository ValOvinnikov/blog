import { MOCK_DB_ERROR_MESSAGE } from '@blog/auth/testing/magic-link-fixtures';
import { MOCK_EMAIL, MOCK_USER_ID } from '@blog/auth/testing/session-fixtures';
import {
  SIGNUP_TERMS_COOKIE_NAME,
  TERMS_VERSION,
} from '@blog/config/constants';

import { recordSignupTermsOnSignIn } from './record-signup-terms-on-sign-in';

const { cookiesMock, recordTermsAcceptanceMock } = vi.hoisted(() => ({
  cookiesMock: vi.fn(),
  recordTermsAcceptanceMock: vi.fn(),
}));

vi.mock('next/headers', () => ({ cookies: cookiesMock }));

vi.mock('@blog/db', () => ({
  queries: { users: { recordTermsAcceptance: recordTermsAcceptanceMock } },
}));

const MOCK_USER = { id: MOCK_USER_ID, email: MOCK_EMAIL };
const MOCK_OLDER_TERMS_VERSION = '2020-01-01';

const withSignupCookie = (value?: string) => {
  cookiesMock.mockResolvedValue({
    get: (name: string) =>
      name === SIGNUP_TERMS_COOKIE_NAME && value !== undefined
        ? { name, value }
        : undefined,
  });
};

describe(recordSignupTermsOnSignIn, () => {
  beforeEach(() => {
    withSignupCookie(TERMS_VERSION);
    recordTermsAcceptanceMock.mockResolvedValue(undefined);
  });

  it('records the current terms for a new user who came through signup', async () => {
    await recordSignupTermsOnSignIn({ user: MOCK_USER, isNewUser: true });

    expect(recordTermsAcceptanceMock).toHaveBeenCalledWith(
      MOCK_USER_ID,
      TERMS_VERSION,
    );
  });

  it('leaves an existing user unchanged', async () => {
    await recordSignupTermsOnSignIn({ user: MOCK_USER, isNewUser: false });

    expect(recordTermsAcceptanceMock).not.toHaveBeenCalled();
  });

  it.each([
    ['without the signup cookie', undefined],
    ['when the cookie names another terms version', MOCK_OLDER_TERMS_VERSION],
  ])('records nothing %s', async (_, cookieValue) => {
    withSignupCookie(cookieValue);

    await recordSignupTermsOnSignIn({ user: MOCK_USER, isNewUser: true });

    expect(recordTermsAcceptanceMock).not.toHaveBeenCalled();
  });

  it('records nothing when the user has no resolved id', async () => {
    await recordSignupTermsOnSignIn({
      user: { email: MOCK_EMAIL },
      isNewUser: true,
    });

    expect(recordTermsAcceptanceMock).not.toHaveBeenCalled();
  });

  it('never fails the sign-in when recording throws', async () => {
    recordTermsAcceptanceMock.mockRejectedValue(
      new Error(MOCK_DB_ERROR_MESSAGE),
    );

    await expect(
      recordSignupTermsOnSignIn({ user: MOCK_USER, isNewUser: true }),
    ).resolves.toBeUndefined();
  });
});
