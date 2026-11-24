import {
  PLATFORM_ADMIN_LOG,
  PLATFORM_ADMIN_REFUSAL,
} from '@platform/constants/platform-admins';
import { signIn } from '@platform/server/auth/auth';
import { requireSuperAdmin } from '@platform/server/auth/require-super-admin';
import { mockAdmin } from '@platform/testing/admins/fixtures';
import {
  MOCK_AUTH_ERROR_TYPE,
  MOCK_AUTH_ERROR_URL,
} from '@platform/testing/auth/fixtures';
import {
  MOCK_ADMIN_INVITE_ID,
  MOCK_INVITED_ADMIN_EMAIL,
  MOCK_LISTED_ADMIN_ID,
  mockAdminInviteEntry,
} from '@platform/testing/platform-admins/fixtures';
import { logger } from '@platform/utils/logger/logger';
import { ACTION_OUTCOME, NEXT_NAVIGATION_ERROR } from '@shinefold/config';
import { queries } from '@shinefold/db';
import { ADMIN_INVITE_OUTCOME, ADMIN_ROLE } from '@shinefold/db/constants';
import { notFound } from 'next/navigation';

import { resendAdminInviteAction } from './resend-admin-invite-action';

vi.hoisted(() => vi.stubEnv('SKIP_ENV_VALIDATION', 'true'));

vi.mock('@platform/server/auth/auth');

vi.mock('@platform/server/auth/require-super-admin');

vi.mock('@shinefold/db', async () =>
  (
    await import('@platform/testing/platform-admins/fixtures')
  ).mockPlatformAdminsDb(),
);

const { adminInvites } = queries;
const createInvite = vi.mocked(adminInvites.createAdminInvite);
const cancelInvite = vi.mocked(adminInvites.cancelAdminInvite);
const signInMock = vi.mocked(signIn);

describe(resendAdminInviteAction, () => {
  beforeEach(() => {});

  it('renews an expired invite with its own role, then emails it again', async () => {
    vi.mocked(adminInvites.listAdminInvites).mockResolvedValueOnce([
      mockAdminInviteEntry({ role: ADMIN_ROLE.SUPERADMIN }),
    ]);

    const result = await resendAdminInviteAction(MOCK_ADMIN_INVITE_ID);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(createInvite).toHaveBeenCalledExactlyOnceWith(
      MOCK_INVITED_ADMIN_EMAIL,
      ADMIN_ROLE.SUPERADMIN,
      mockAdmin().userId,
    );
    expect(signInMock).toHaveBeenCalledOnce();
  });

  it('refuses a caller who is not a super admin', async () => {
    vi.mocked(requireSuperAdmin).mockImplementationOnce(() => {
      notFound();
    });

    await expect(resendAdminInviteAction(MOCK_ADMIN_INVITE_ID)).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
    );
    expect(createInvite).not.toHaveBeenCalled();
  });

  it('refuses an invite that is not listed', async () => {
    const result = await resendAdminInviteAction(MOCK_LISTED_ADMIN_ID);

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: PLATFORM_ADMIN_REFUSAL.NOT_FOUND,
    });
    expect(createInvite).not.toHaveBeenCalled();
  });

  it('refuses an address that became an admin and sends nothing', async () => {
    createInvite.mockResolvedValueOnce({
      outcome: ADMIN_INVITE_OUTCOME.ALREADY_ADMIN,
    });

    const result = await resendAdminInviteAction(MOCK_ADMIN_INVITE_ID);

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: PLATFORM_ADMIN_REFUSAL.ALREADY_ADMIN,
    });
    expect(signInMock).not.toHaveBeenCalled();
  });

  it('keeps the renewed invite and logs when the email does not go out', async () => {
    signInMock.mockResolvedValue(MOCK_AUTH_ERROR_URL);

    const result = await resendAdminInviteAction(MOCK_ADMIN_INVITE_ID);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(cancelInvite).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledExactlyOnceWith(
      PLATFORM_ADMIN_LOG.RESEND_EMAIL_FAILED,
      { inviteId: MOCK_ADMIN_INVITE_ID, reason: MOCK_AUTH_ERROR_TYPE },
    );
  });
});
