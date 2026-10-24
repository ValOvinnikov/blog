import { MAGIC_LINK_PROVIDER_ID } from '@blog/auth/providers/magic-link/magic-link-provider/magic-link-provider';
import { ACTION_OUTCOME } from '@blog/config';
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

describe(sendSignInLinkAction, () => {
  beforeEach(() => {
    vi.mocked(signIn).mockReset();
  });

  it('emails a sign-in link that returns to the requested page', async () => {
    const result = await sendSignInLinkAction({
      email: ` ${MOCK_SIGN_IN_EMAIL.toUpperCase()} `,
      callbackPath: adminRoutes.dashboardLeads(),
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
      email: MOCK_SIGN_IN_EMAIL,
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
      email: MOCK_NOT_AN_EMAIL,
      callbackPath: adminRoutes.dashboardLeads(),
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

    const result = await sendSignInLinkAction({
      email: MOCK_SIGN_IN_EMAIL,
      callbackPath: adminRoutes.dashboardLeads(),
    });

    const context = vi.mocked(logger.error).mock.calls[0]?.[1];
    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(logger.error).toHaveBeenCalledOnce();
    expect(context).toEqual({ error });
  });
});
