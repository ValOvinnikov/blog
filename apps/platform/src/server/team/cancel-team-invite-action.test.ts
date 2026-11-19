import { TEAM_ACCESS_LOG, TEAM_REFUSAL } from '@platform/constants/team-access';
import { recordAuditEvent } from '@platform/server/audit/record-audit-event';
import { requireTenantMembership } from '@platform/server/auth/require-tenant-membership';
import {
  mockEditorMembershipContext,
  mockOperatorMembershipContext,
} from '@platform/testing/memberships/fixtures';
import {
  MOCK_INVITE_ID,
  MOCK_MEMBER_EMAIL,
  mockPendingInvite,
} from '@platform/testing/team/fixtures';
import {
  MOCK_TENANT_ID,
  mockReadyTenant,
} from '@platform/testing/tenants/fixtures';
import { logger } from '@platform/utils/logger/logger';
import {
  ACTION_OUTCOME,
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  NEXT_NAVIGATION_ERROR,
} from '@shinefold/config';
import { queries } from '@shinefold/db';
import { MEMBERSHIP_ROLE } from '@shinefold/db/constants';

import { cancelTeamInviteAction } from './cancel-team-invite-action';

vi.mock('@platform/server/auth/require-tenant-membership');

vi.mock('@platform/server/audit/record-audit-event');

vi.mock('@shinefold/db', async () =>
  (await import('@platform/testing/team/fixtures')).mockTeamDb(),
);

const { membershipInvites } = queries;
const cancelInvite = vi.mocked(membershipInvites.cancelMembershipInvite);
const listInvites = vi.mocked(membershipInvites.listPendingMembershipInvites);

const cancel = (inviteId = MOCK_INVITE_ID) =>
  cancelTeamInviteAction(MOCK_TENANT_ID, inviteId);

const notFound = {
  outcome: ACTION_OUTCOME.REFUSED,
  reason: TEAM_REFUSAL.NOT_FOUND,
};

describe(cancelTeamInviteAction, () => {
  it('deletes the invite and records it without the address', async () => {
    const result = await cancel();

    expect(cancelInvite).toHaveBeenCalledExactlyOnceWith(
      MOCK_TENANT_ID,
      MOCK_INVITE_ID,
    );
    expect(recordAuditEvent).toHaveBeenCalledExactlyOnceWith({
      logEvent: TEAM_ACCESS_LOG.CANCEL_AUDIT_FAILED,
      action: AUDIT_ACTION.MEMBER_INVITE_CANCELLED,
      targetType: AUDIT_TARGET_TYPE.TEAM_MEMBER,
      targetId: MOCK_INVITE_ID,
      details: { role: MEMBERSHIP_ROLE.EDITOR },
    });
    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
  });

  it('lets an operator cancel on any tenant', async () => {
    vi.mocked(requireTenantMembership).mockResolvedValue(
      mockOperatorMembershipContext(mockReadyTenant()),
    );

    expect(await cancel()).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
  });

  it('refuses an editor and writes nothing', async () => {
    vi.mocked(requireTenantMembership).mockResolvedValue(
      mockEditorMembershipContext(mockReadyTenant()),
    );

    await expect(cancel()).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
    );
    expect(cancelInvite).not.toHaveBeenCalled();
  });

  it('never cancels a pending owner invite', async () => {
    listInvites.mockResolvedValue([
      mockPendingInvite({ role: MEMBERSHIP_ROLE.OWNER }),
    ]);

    expect(await cancel()).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: TEAM_REFUSAL.OWNER_INVITE,
    });
    expect(cancelInvite).not.toHaveBeenCalled();
  });

  it('answers not found for an invite no longer pending', async () => {
    listInvites.mockResolvedValue([]);

    expect(await cancel()).toEqual(notFound);
    expect(cancelInvite).not.toHaveBeenCalled();
  });

  it('answers not found when the invite goes before the delete', async () => {
    cancelInvite.mockResolvedValue(false);

    expect(await cancel()).toEqual(notFound);
    expect(recordAuditEvent).not.toHaveBeenCalled();
  });

  it('answers not found for an id that is not an invite id', async () => {
    expect(await cancel(MOCK_MEMBER_EMAIL)).toEqual(notFound);
    expect(listInvites).not.toHaveBeenCalled();
  });

  it('logs and fails when the delete throws', async () => {
    cancelInvite.mockRejectedValue(new Error());

    expect(await cancel()).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(logger.error).toHaveBeenCalledWith(
      TEAM_ACCESS_LOG.CANCEL_FAILED,
      expect.objectContaining({ inviteId: MOCK_INVITE_ID }),
    );
  });
});
