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

const EMAIL = 'signup@example.com';
const USER = { id: 'signup-user', email: EMAIL };

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
    await recordSignupTermsOnSignIn({ user: USER, isNewUser: true });

    expect(recordTermsAcceptanceMock).toHaveBeenCalledWith(
      USER.id,
      TERMS_VERSION,
    );
  });

  it('leaves an existing user unchanged', async () => {
    await recordSignupTermsOnSignIn({ user: USER, isNewUser: false });

    expect(recordTermsAcceptanceMock).not.toHaveBeenCalled();
  });

  it('records nothing without the signup cookie', async () => {
    withSignupCookie();

    await recordSignupTermsOnSignIn({ user: USER, isNewUser: true });

    expect(recordTermsAcceptanceMock).not.toHaveBeenCalled();
  });

  it('records nothing when the cookie names another terms version', async () => {
    withSignupCookie('2020-01-01');

    await recordSignupTermsOnSignIn({ user: USER, isNewUser: true });

    expect(recordTermsAcceptanceMock).not.toHaveBeenCalled();
  });

  it('records nothing when the user has no resolved id', async () => {
    await recordSignupTermsOnSignIn({
      user: { email: EMAIL },
      isNewUser: true,
    });

    expect(recordTermsAcceptanceMock).not.toHaveBeenCalled();
  });

  it('never fails the sign-in when recording throws', async () => {
    recordTermsAcceptanceMock.mockRejectedValue(new Error('db down'));

    await expect(
      recordSignupTermsOnSignIn({ user: USER, isNewUser: true }),
    ).resolves.toBeUndefined();
  });
});
