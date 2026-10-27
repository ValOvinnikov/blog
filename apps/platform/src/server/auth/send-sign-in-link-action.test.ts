import { MAGIC_LINK_PROVIDER_ID } from '@blog/auth/providers/magic-link/magic-link-provider/magic-link-provider';
import { MagicLinkSendLimitedError } from '@blog/auth/providers/magic-link/magic-link-send-limited-error/magic-link-send-limited-error';
import { ACTION_OUTCOME } from '@blog/config';
import { SIGN_IN_LOG } from '@platform/constants/sign-in';
import { TENANT_FIELD_ERROR } from '@platform/constants/tenant';
import { signIn } from '@platform/server/auth/auth';
import {
  MOCK_OFF_ORIGIN_PATH,
  MOCK_SIGN_IN_EMAIL,
} from '@platform/testing/auth/fixtures';
import { MOCK_NOT_AN_EMAIL } from '@platform/testing/data-requests/fixtures';
import { logger } from '@platform/utils/logger/logger';
import { adminRoutes } from '@platform/utils/routes/routes';

import { sendSignInLinkAction } from './send-sign-in-link-action';

vi.hoisted(() => vi.stubEnv('SKIP_ENV_VALIDATION', 'true'));

vi.mock('@platform/server/auth/auth');

const MOCK_SIGN_IN_INPUT = {
  email: MOCK_SIGN_IN_EMAIL,
  callbackPath: adminRoutes.dashboardLeads(),
};

describe(sendSignInLinkAction, () => {
  beforeEach(() => {
    vi.mocked(signIn).mockReset();
  });

  it('emails a sign-in link that returns to the requested page', async () => {
    const result = await sendSignInLinkAction({
      ...MOCK_SIGN_IN_INPUT,
      email: ` ${MOCK_SIGN_IN_EMAIL.toUpperCase()} `,
    });

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(signIn).toHaveBeenCalledWith(MAGIC_LINK_PROVIDER_ID, {
      email: MOCK_SIGN_IN_EMAIL,
      redirectTo: adminRoutes.dashboardLeads(),
      redirect: false,
    });
  });

  it('returns a link that would leave this origin to home instead', async () => {
    await sendSignInLinkAction({
      ...MOCK_SIGN_IN_INPUT,
      callbackPath: MOCK_OFF_ORIGIN_PATH,
    });

    expect(signIn).toHaveBeenCalledWith(MAGIC_LINK_PROVIDER_ID, {
      email: MOCK_SIGN_IN_EMAIL,
      redirectTo: adminRoutes.home(),
      redirect: false,
    });
  });

  it('refuses an address that is not an email, sending nothing', async () => {
    const result = await sendSignInLinkAction({
      ...MOCK_SIGN_IN_INPUT,
      email: MOCK_NOT_AN_EMAIL,
    });

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: { email: { reason: TENANT_FIELD_ERROR.EMAIL_INVALID } },
    });
    expect(signIn).not.toHaveBeenCalled();
  });

  it('logs and reports a send that fails', async () => {
    const error = new Error();
    vi.mocked(signIn).mockRejectedValueOnce(error);

    const result = await sendSignInLinkAction(MOCK_SIGN_IN_INPUT);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(logger.error).toHaveBeenCalledWith(SIGN_IN_LOG.LINK_FAILED, {
      errorName: error.name,
    });
  });

  it('reports a send refused by the send limit without logging a failure', async () => {
    vi.mocked(signIn).mockRejectedValueOnce(new MagicLinkSendLimitedError());

    const result = await sendSignInLinkAction(MOCK_SIGN_IN_INPUT);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.RATE_LIMITED });
    expect(logger.error).not.toHaveBeenCalled();
  });
});
