import { ACTION_OUTCOME } from '@blog/config';
import { TENANT_FIELD_ERROR } from '@platform/constants/tenant';
import { signIn } from '@platform/server/auth/auth';
import { logger } from '@platform/utils/logger/logger';

import { sendSignInLinkAction } from './send-sign-in-link-action';

vi.mock('@platform/server/auth/auth');

const MOCK_EMAIL = 'jane@example.com';
const MOCK_CALLBACK_PATH = '/dashboard/leads';

describe(sendSignInLinkAction, () => {
  beforeEach(() => {
    vi.mocked(signIn).mockReset();
  });

  it('emails a sign-in link that returns to the requested page', async () => {
    const result = await sendSignInLinkAction({
      email: ' Jane@Example.com ',
      callbackPath: MOCK_CALLBACK_PATH,
    });

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(signIn).toHaveBeenCalledWith('email', {
      email: MOCK_EMAIL,
      redirectTo: MOCK_CALLBACK_PATH,
      redirect: false,
    });
  });

  it('returns a link that would leave this origin to home instead', async () => {
    await sendSignInLinkAction({
      email: MOCK_EMAIL,
      callbackPath: '//evil.example',
    });

    expect(signIn).toHaveBeenCalledWith('email', {
      email: MOCK_EMAIL,
      redirectTo: '/',
      redirect: false,
    });
  });

  it('refuses an address that is not an email, sending nothing', async () => {
    const result = await sendSignInLinkAction({
      email: 'not-an-email',
      callbackPath: MOCK_CALLBACK_PATH,
    });

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: { email: { reason: TENANT_FIELD_ERROR.EMAIL_INVALID } },
    });
    expect(signIn).not.toHaveBeenCalled();
  });

  it('logs and reports a send that fails', async () => {
    const error = new Error('EmailSignInError');
    vi.mocked(signIn).mockRejectedValueOnce(error);

    const result = await sendSignInLinkAction({
      email: MOCK_EMAIL,
      callbackPath: MOCK_CALLBACK_PATH,
    });

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(logger.error).toHaveBeenCalledWith('auth.sign_in_link_failed', {
      error,
    });
  });
});
