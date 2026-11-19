import { TEAM_ACCESS_LOG } from '@platform/constants/team-access';
import { TENANT_LOG } from '@platform/constants/tenant';
import { signIn } from '@platform/server/auth/auth';
import {
  MOCK_AUTH_ERROR_TYPE,
  MOCK_AUTH_ERROR_URL,
  MOCK_VERIFY_REQUEST_URL,
} from '@platform/testing/auth/fixtures';
import {
  MOCK_POSTGRES_ERROR_CODE,
  MOCK_QUERY_ERROR_NAME,
  mockQueryError,
} from '@platform/testing/loggable-error/fixtures';
import {
  MOCK_OWNER_EMAIL,
  MOCK_TENANT_ID,
} from '@platform/testing/tenants/fixtures';
import { logger } from '@platform/utils/logger/logger';
import { adminRoutes } from '@platform/utils/routes/routes';
import { MAGIC_LINK_PROVIDER_ID } from '@shinefold/auth/providers/magic-link/magic-link-provider/magic-link-provider';

import { sendOwnerInviteEmail } from './send-owner-invite-email';

vi.hoisted(() => vi.stubEnv('SKIP_ENV_VALIDATION', 'true'));

vi.mock('@platform/server/auth/auth');

const signInMock = vi.mocked(signIn);
const loggerErrorMock = vi.mocked(logger.error);

describe(sendOwnerInviteEmail, () => {
  beforeEach(() => {
    signInMock.mockReset();
    signInMock.mockResolvedValue(MOCK_VERIFY_REQUEST_URL);
  });

  it("emails the owner a magic link that lands on their site's dashboard", async () => {
    await sendOwnerInviteEmail(MOCK_TENANT_ID, MOCK_OWNER_EMAIL);

    expect(signInMock).toHaveBeenCalledWith(MAGIC_LINK_PROVIDER_ID, {
      email: MOCK_OWNER_EMAIL,
      redirect: false,
      redirectTo: adminRoutes.dashboardSelectTenantHref(MOCK_TENANT_ID),
    });
  });

  it('reports the email sent, logging nothing, on the check-inbox page', async () => {
    const isSent = await sendOwnerInviteEmail(MOCK_TENANT_ID, MOCK_OWNER_EMAIL);

    expect(isSent).toBe(true);
    expect(loggerErrorMock).not.toHaveBeenCalled();
  });

  it('logs the error name and code, never the owner email, when the send throws', async () => {
    signInMock.mockRejectedValue(mockQueryError(MOCK_OWNER_EMAIL));

    const isSent = await sendOwnerInviteEmail(MOCK_TENANT_ID, MOCK_OWNER_EMAIL);

    expect(isSent).toBe(false);
    expect(loggerErrorMock).toHaveBeenCalledExactlyOnceWith(
      TENANT_LOG.OWNER_INVITE_EMAIL_FAILED,
      {
        tenantId: MOCK_TENANT_ID,
        errorName: MOCK_QUERY_ERROR_NAME,
        errorCode: MOCK_POSTGRES_ERROR_CODE,
      },
    );
  });

  describe('when the send lands on the error page', () => {
    beforeEach(() => {
      signInMock.mockResolvedValue(MOCK_AUTH_ERROR_URL);
    });

    it('logs the tenant and Auth.js error', async () => {
      const isSent = await sendOwnerInviteEmail(
        MOCK_TENANT_ID,
        MOCK_OWNER_EMAIL,
      );

      expect(isSent).toBe(false);
      expect(loggerErrorMock).toHaveBeenCalledExactlyOnceWith(
        TENANT_LOG.OWNER_INVITE_EMAIL_FAILED,
        { tenantId: MOCK_TENANT_ID, reason: MOCK_AUTH_ERROR_TYPE },
      );
    });

    it('logs a failed send under the event its caller names', async () => {
      await sendOwnerInviteEmail(
        MOCK_TENANT_ID,
        MOCK_OWNER_EMAIL,
        TEAM_ACCESS_LOG.INVITE_EMAIL_FAILED,
      );

      expect(loggerErrorMock).toHaveBeenCalledExactlyOnceWith(
        TEAM_ACCESS_LOG.INVITE_EMAIL_FAILED,
        { tenantId: MOCK_TENANT_ID, reason: MOCK_AUTH_ERROR_TYPE },
      );
    });
  });
});
