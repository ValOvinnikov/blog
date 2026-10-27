import { MAGIC_LINK_PROVIDER_ID } from '@blog/auth/providers/magic-link/magic-link-provider/magic-link-provider';
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

  it('emails the owner a magic link without redirecting', async () => {
    await sendOwnerInviteEmail(MOCK_TENANT_ID, MOCK_OWNER_EMAIL);

    expect(signInMock).toHaveBeenCalledWith(MAGIC_LINK_PROVIDER_ID, {
      email: MOCK_OWNER_EMAIL,
      redirect: false,
    });
  });

  it('logs nothing when Auth.js sends the reader on to check their inbox', async () => {
    await sendOwnerInviteEmail(MOCK_TENANT_ID, MOCK_OWNER_EMAIL);

    expect(loggerErrorMock).not.toHaveBeenCalled();
  });

  it('logs the tenant and Auth.js error when the send lands on the error page', async () => {
    signInMock.mockResolvedValue(MOCK_AUTH_ERROR_URL);

    await sendOwnerInviteEmail(MOCK_TENANT_ID, MOCK_OWNER_EMAIL);

    expect(loggerErrorMock).toHaveBeenCalledExactlyOnceWith(
      TENANT_LOG.OWNER_INVITE_EMAIL_FAILED,
      { tenantId: MOCK_TENANT_ID, reason: MOCK_AUTH_ERROR_TYPE },
    );
  });

  it('logs the error name and code, never the owner email, when the send throws', async () => {
    signInMock.mockRejectedValue(mockQueryError(MOCK_OWNER_EMAIL));

    await sendOwnerInviteEmail(MOCK_TENANT_ID, MOCK_OWNER_EMAIL);

    expect(loggerErrorMock).toHaveBeenCalledExactlyOnceWith(
      TENANT_LOG.OWNER_INVITE_EMAIL_FAILED,
      {
        tenantId: MOCK_TENANT_ID,
        errorName: MOCK_QUERY_ERROR_NAME,
        errorCode: MOCK_POSTGRES_ERROR_CODE,
      },
    );
  });
});
