import {
  PLATFORM_ADMIN_LOG,
  PLATFORM_ADMIN_REFUSAL,
} from '@platform/constants/platform-admins';
import { recordAuditEvent } from '@platform/server/audit/record-audit-event';
import { requireSuperAdmin } from '@platform/server/auth/require-super-admin';
import {
  MOCK_ADMIN_INVITE_ID,
  MOCK_LISTED_ADMIN_ID,
} from '@platform/testing/platform-admins/fixtures';
import {
  ACTION_OUTCOME,
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  NEXT_NAVIGATION_ERROR,
} from '@shinefold/config';
import { queries } from '@shinefold/db';
import { ADMIN_ROLE } from '@shinefold/db/constants';
import { notFound } from 'next/navigation';

import { cancelAdminInviteAction } from './cancel-admin-invite-action';

vi.mock('@platform/server/auth/require-super-admin');

vi.mock('@platform/server/audit/record-audit-event');

vi.mock('@shinefold/db', async () =>
  (
    await import('@platform/testing/platform-admins/fixtures')
  ).mockPlatformAdminsDb(),
);

const cancelInvite = vi.mocked(queries.adminInvites.cancelAdminInvite);

describe(cancelAdminInviteAction, () => {
  it('cancels the invite and audits it with its role', async () => {
    const result = await cancelAdminInviteAction(MOCK_ADMIN_INVITE_ID);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(cancelInvite).toHaveBeenCalledExactlyOnceWith(MOCK_ADMIN_INVITE_ID);
    expect(recordAuditEvent).toHaveBeenCalledExactlyOnceWith({
      logEvent: PLATFORM_ADMIN_LOG.CANCEL_AUDIT_FAILED,
      action: AUDIT_ACTION.ADMIN_INVITE_CANCELLED,
      targetType: AUDIT_TARGET_TYPE.PLATFORM_ADMIN,
      targetId: MOCK_ADMIN_INVITE_ID,
      details: { role: ADMIN_ROLE.ADMIN },
    });
  });

  it('refuses a caller who is not a super admin', async () => {
    vi.mocked(requireSuperAdmin).mockImplementationOnce(() => {
      notFound();
    });

    await expect(cancelAdminInviteAction(MOCK_ADMIN_INVITE_ID)).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
    );
    expect(cancelInvite).not.toHaveBeenCalled();
  });

  it('refuses an invite that is not listed and records nothing', async () => {
    const result = await cancelAdminInviteAction(MOCK_LISTED_ADMIN_ID);

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: PLATFORM_ADMIN_REFUSAL.NOT_FOUND,
    });
    expect(cancelInvite).not.toHaveBeenCalled();
    expect(recordAuditEvent).not.toHaveBeenCalled();
  });

  it('records nothing when the invite was already gone', async () => {
    cancelInvite.mockResolvedValueOnce(false);

    const result = await cancelAdminInviteAction(MOCK_ADMIN_INVITE_ID);

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: PLATFORM_ADMIN_REFUSAL.NOT_FOUND,
    });
    expect(recordAuditEvent).not.toHaveBeenCalled();
  });
});
