import {
  PLATFORM_ADMIN_LOG,
  PLATFORM_ADMIN_REFUSAL,
} from '@platform/constants/platform-admins';
import { recordAuditEvent } from '@platform/server/audit/record-audit-event';
import { requireSuperAdmin } from '@platform/server/auth/require-super-admin';
import { mockAdmin } from '@platform/testing/admins/fixtures';
import { MOCK_NETWORK_ERROR } from '@platform/testing/http/network-error';
import {
  MOCK_ADMIN_INVITE_ID,
  MOCK_LISTED_ADMIN_ID,
  MOCK_LISTED_ADMIN_USER_ID,
} from '@platform/testing/platform-admins/fixtures';
import { logger } from '@platform/utils/logger/logger';
import {
  ACTION_OUTCOME,
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  NEXT_NAVIGATION_ERROR,
} from '@shinefold/config';
import { queries } from '@shinefold/db';
import { ADMIN_REMOVAL_OUTCOME, ADMIN_ROLE } from '@shinefold/db/constants';
import { notFound } from 'next/navigation';

import { removeAdminAction } from './remove-admin-action';

vi.mock('@platform/server/auth/require-super-admin');

vi.mock('@platform/server/audit/record-audit-event');

vi.mock('@shinefold/db', async () =>
  (
    await import('@platform/testing/platform-admins/fixtures')
  ).mockPlatformAdminsDb(),
);

const deleteAdmin = vi.mocked(queries.admins.deleteAdmin);

describe(removeAdminAction, () => {
  it('removes the admin and audits it with their role and user', async () => {
    const result = await removeAdminAction(MOCK_LISTED_ADMIN_ID);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(deleteAdmin).toHaveBeenCalledExactlyOnceWith(MOCK_LISTED_ADMIN_ID);
    expect(recordAuditEvent).toHaveBeenCalledExactlyOnceWith({
      logEvent: PLATFORM_ADMIN_LOG.REMOVE_AUDIT_FAILED,
      action: AUDIT_ACTION.ADMIN_REMOVED,
      targetType: AUDIT_TARGET_TYPE.PLATFORM_ADMIN,
      targetId: MOCK_LISTED_ADMIN_ID,
      details: { role: ADMIN_ROLE.ADMIN, userId: MOCK_LISTED_ADMIN_USER_ID },
    });
  });

  it('refuses a caller who is not a super admin', async () => {
    vi.mocked(requireSuperAdmin).mockImplementationOnce(() => {
      notFound();
    });

    await expect(removeAdminAction(MOCK_LISTED_ADMIN_ID)).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
    );
    expect(deleteAdmin).not.toHaveBeenCalled();
  });

  it('refuses to remove the signed-in admin', async () => {
    vi.mocked(requireSuperAdmin).mockResolvedValueOnce(
      mockAdmin({ id: MOCK_LISTED_ADMIN_ID, role: ADMIN_ROLE.SUPERADMIN }),
    );

    const result = await removeAdminAction(MOCK_LISTED_ADMIN_ID);

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: PLATFORM_ADMIN_REFUSAL.SELF,
    });
    expect(deleteAdmin).not.toHaveBeenCalled();
  });

  it('refuses the last super admin and records nothing', async () => {
    deleteAdmin.mockResolvedValueOnce(ADMIN_REMOVAL_OUTCOME.LAST_SUPERADMIN);

    const result = await removeAdminAction(MOCK_LISTED_ADMIN_ID);

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: PLATFORM_ADMIN_REFUSAL.LAST_SUPERADMIN,
    });
    expect(recordAuditEvent).not.toHaveBeenCalled();
  });

  it.each([
    ['an admin who is not listed', MOCK_ADMIN_INVITE_ID],
    ['an id that is not a uuid', ADMIN_ROLE.ADMIN],
  ])('refuses %s as not found', async (_case, adminId) => {
    const result = await removeAdminAction(adminId);

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: PLATFORM_ADMIN_REFUSAL.NOT_FOUND,
    });
    expect(deleteAdmin).not.toHaveBeenCalled();
  });

  it('returns a server error and logs when the removal throws', async () => {
    deleteAdmin.mockRejectedValueOnce(MOCK_NETWORK_ERROR);

    const result = await removeAdminAction(MOCK_LISTED_ADMIN_ID);

    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(logger.error).toHaveBeenCalledWith(
      PLATFORM_ADMIN_LOG.REMOVE_FAILED,
      { adminId: MOCK_LISTED_ADMIN_ID, errorName: MOCK_NETWORK_ERROR.name },
    );
  });
});
