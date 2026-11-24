import {
  ADMIN_INVITE_FIELD_ERROR,
  PLATFORM_ADMIN_LOG,
} from '@platform/constants/platform-admins';
import { recordAuditEvent } from '@platform/server/audit/record-audit-event';
import { signIn } from '@platform/server/auth/auth';
import { requireSuperAdmin } from '@platform/server/auth/require-super-admin';
import { mockAdmin } from '@platform/testing/admins/fixtures';
import { MOCK_AUTH_ERROR_URL } from '@platform/testing/auth/fixtures';
import { MOCK_NOT_AN_EMAIL } from '@platform/testing/data-requests/fixtures';
import { MOCK_NETWORK_ERROR } from '@platform/testing/http/network-error';
import {
  MOCK_ADMIN_INVITE_ID,
  MOCK_INVITED_ADMIN_EMAIL,
} from '@platform/testing/platform-admins/fixtures';
import { logger } from '@platform/utils/logger/logger';
import { adminRoutes } from '@platform/utils/routes/routes';
import { MAGIC_LINK_PROVIDER_ID } from '@shinefold/auth/providers/magic-link/magic-link-provider/magic-link-provider';
import {
  ACTION_OUTCOME,
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  NEXT_NAVIGATION_ERROR,
} from '@shinefold/config';
import { queries } from '@shinefold/db';
import { ADMIN_INVITE_OUTCOME, ADMIN_ROLE } from '@shinefold/db/constants';
import { notFound } from 'next/navigation';

import { inviteAdminAction } from './invite-admin-action';

vi.hoisted(() => vi.stubEnv('SKIP_ENV_VALIDATION', 'true'));

vi.mock('@platform/server/auth/auth');

vi.mock('@platform/server/auth/require-super-admin');

vi.mock('@platform/server/audit/record-audit-event');

vi.mock('@shinefold/db', async () =>
  (
    await import('@platform/testing/platform-admins/fixtures')
  ).mockPlatformAdminsDb(),
);

const { adminInvites } = queries;
const createInvite = vi.mocked(adminInvites.createAdminInvite);
const cancelInvite = vi.mocked(adminInvites.cancelAdminInvite);
const signInMock = vi.mocked(signIn);

const invite = (
  email = MOCK_INVITED_ADMIN_EMAIL,
  role: string = ADMIN_ROLE.ADMIN,
) =>
  inviteAdminAction({ email, role } as Parameters<typeof inviteAdminAction>[0]);

describe(inviteAdminAction, () => {
  beforeEach(() => {});

  it('creates, emails and audits the invite without its address', async () => {
    const result = await invite(
      ` ${MOCK_INVITED_ADMIN_EMAIL.toUpperCase()} `,
      ADMIN_ROLE.SUPERADMIN,
    );

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(createInvite).toHaveBeenCalledExactlyOnceWith(
      MOCK_INVITED_ADMIN_EMAIL,
      ADMIN_ROLE.SUPERADMIN,
      mockAdmin().userId,
    );
    expect(signInMock).toHaveBeenCalledExactlyOnceWith(MAGIC_LINK_PROVIDER_ID, {
      email: MOCK_INVITED_ADMIN_EMAIL,
      redirect: false,
      redirectTo: adminRoutes.tenants(),
    });
    expect(recordAuditEvent).toHaveBeenCalledExactlyOnceWith({
      logEvent: PLATFORM_ADMIN_LOG.INVITE_AUDIT_FAILED,
      action: AUDIT_ACTION.ADMIN_INVITED,
      targetType: AUDIT_TARGET_TYPE.PLATFORM_ADMIN,
      targetId: MOCK_ADMIN_INVITE_ID,
      details: { role: ADMIN_ROLE.SUPERADMIN },
    });
  });

  it('refuses a caller who is not a super admin and writes nothing', async () => {
    vi.mocked(requireSuperAdmin).mockImplementationOnce(() => {
      notFound();
    });

    await expect(invite()).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
    );
    expect(createInvite).not.toHaveBeenCalled();
  });

  it('refuses a crafted moderator invite as an invalid role', async () => {
    const result = await invite(MOCK_INVITED_ADMIN_EMAIL, ADMIN_ROLE.MODERATOR);

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: {
        role: { reason: ADMIN_INVITE_FIELD_ERROR.ROLE_INVALID },
      },
    });
    expect(createInvite).not.toHaveBeenCalled();
  });

  it('refuses a malformed address', async () => {
    const result = await invite(MOCK_NOT_AN_EMAIL);

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: {
        email: { reason: ADMIN_INVITE_FIELD_ERROR.EMAIL_INVALID },
      },
    });
  });

  it('names an address that is already an admin and sends nothing', async () => {
    createInvite.mockResolvedValueOnce({
      outcome: ADMIN_INVITE_OUTCOME.ALREADY_ADMIN,
    });

    const result = await invite();

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: {
        email: {
          reason: ADMIN_INVITE_FIELD_ERROR.ALREADY_ADMIN,
          values: { email: MOCK_INVITED_ADMIN_EMAIL },
        },
      },
    });
    expect(signInMock).not.toHaveBeenCalled();
    expect(recordAuditEvent).not.toHaveBeenCalled();
  });

  it('cancels the invite and records nothing when the email does not go out', async () => {
    signInMock.mockResolvedValue(MOCK_AUTH_ERROR_URL);

    const result = await invite();

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(cancelInvite).toHaveBeenCalledExactlyOnceWith(MOCK_ADMIN_INVITE_ID);
    expect(recordAuditEvent).not.toHaveBeenCalled();
  });

  it('returns a server error and logs when the invite cannot be stored', async () => {
    createInvite.mockRejectedValueOnce(MOCK_NETWORK_ERROR);

    const result = await invite();

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(logger.error).toHaveBeenCalledWith(
      PLATFORM_ADMIN_LOG.INVITE_FAILED,
      { errorName: MOCK_NETWORK_ERROR.name },
    );
  });
});
