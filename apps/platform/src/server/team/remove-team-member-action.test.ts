import { TEAM_ACCESS_LOG, TEAM_REFUSAL } from '@platform/constants/team-access';
import { recordAuditEvent } from '@platform/server/audit/record-audit-event';
import { requireTenantMembership } from '@platform/server/auth/require-tenant-membership';
import {
  mockEditorMembershipContext,
  mockMembershipContext,
  mockOperatorMembershipContext,
} from '@platform/testing/memberships/fixtures';
import {
  MOCK_MEMBER_EMAIL,
  MOCK_MEMBER_ID,
  MOCK_SANITY_USER_ID,
  mockTenantMember,
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
import {
  MEMBERSHIP_REMOVAL_OUTCOME,
  MEMBERSHIP_ROLE,
  type TMembershipRole,
} from '@shinefold/db/constants';

import { removeTeamMemberAction } from './remove-team-member-action';
import { revokeMemberStudioAccess } from './revoke-member-studio-access';

vi.mock('@platform/server/auth/require-tenant-membership');

vi.mock('@platform/server/audit/record-audit-event');

vi.mock('./revoke-member-studio-access', () => ({
  revokeMemberStudioAccess: vi.fn(),
}));

vi.mock('next/server');

vi.mock('@shinefold/db', async () =>
  (await import('@platform/testing/team/fixtures')).mockTeamDb(),
);

const { memberships } = queries;
const removeMembership = vi.mocked(memberships.removeMembership);

const remove = (membershipId = MOCK_MEMBER_ID) =>
  removeTeamMemberAction(MOCK_TENANT_ID, membershipId);

const withMember = (role: TMembershipRole) =>
  vi
    .mocked(memberships.listTenantMembers)
    .mockResolvedValue([mockTenantMember({ role })]);

describe(removeTeamMemberAction, () => {
  beforeEach(() => {
    vi.mocked(requireTenantMembership)
      .mockReset()
      .mockResolvedValue(mockMembershipContext(mockReadyTenant()));
    withMember(MEMBERSHIP_ROLE.EDITOR);
    vi.mocked(memberships.getMemberStudioIdentity).mockResolvedValue({
      email: MOCK_MEMBER_EMAIL,
      sanityUserId: MOCK_SANITY_USER_ID,
    });
    removeMembership
      .mockReset()
      .mockResolvedValue(MEMBERSHIP_REMOVAL_OUTCOME.REMOVED);
    vi.mocked(revokeMemberStudioAccess).mockReset();
    vi.mocked(recordAuditEvent).mockReset();
  });

  it('removes an editor, revokes Studio access, audits without the address', async () => {
    const result = await remove();

    expect(removeMembership).toHaveBeenCalledExactlyOnceWith(
      MOCK_TENANT_ID,
      MOCK_MEMBER_ID,
      mockMembershipContext(mockReadyTenant()).membership.userId,
    );
    expect(revokeMemberStudioAccess).toHaveBeenCalledExactlyOnceWith(
      MOCK_TENANT_ID,
      { memberEmail: MOCK_MEMBER_EMAIL, sanityUserId: MOCK_SANITY_USER_ID },
    );
    expect(recordAuditEvent).toHaveBeenCalledExactlyOnceWith({
      logEvent: TEAM_ACCESS_LOG.REMOVE_AUDIT_FAILED,
      action: AUDIT_ACTION.MEMBER_REMOVED,
      targetType: AUDIT_TARGET_TYPE.TEAM_MEMBER,
      targetId: MOCK_MEMBER_ID,
      details: { role: MEMBERSHIP_ROLE.EDITOR },
    });
    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
  });

  it.each([MEMBERSHIP_ROLE.READER, MEMBERSHIP_ROLE.OWNER])(
    'removes a %s without a revoke',
    async (role) => {
      withMember(role);

      expect(await remove()).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
      expect(revokeMemberStudioAccess).not.toHaveBeenCalled();
    },
  );

  it('logs, without a revoke, an editor whose address cannot be read', async () => {
    vi.mocked(memberships.getMemberStudioIdentity).mockResolvedValue({
      email: undefined,
      sanityUserId: MOCK_SANITY_USER_ID,
    });

    expect(await remove()).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
    expect(revokeMemberStudioAccess).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledExactlyOnceWith(
      TEAM_ACCESS_LOG.REVOKE_SKIPPED_NO_EMAIL,
      { tenantId: MOCK_TENANT_ID, membershipId: MOCK_MEMBER_ID },
    );
  });

  it('lets an operator remove on any tenant', async () => {
    vi.mocked(requireTenantMembership).mockResolvedValue(
      mockOperatorMembershipContext(mockReadyTenant()),
    );

    expect(await remove()).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
  });

  it('refuses an editor and writes nothing', async () => {
    vi.mocked(requireTenantMembership).mockResolvedValue(
      mockEditorMembershipContext(mockReadyTenant()),
    );

    await expect(remove()).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
    );
    expect(removeMembership).not.toHaveBeenCalled();
  });

  it.each([
    [MEMBERSHIP_REMOVAL_OUTCOME.SELF, TEAM_REFUSAL.SELF],
    [MEMBERSHIP_REMOVAL_OUTCOME.LAST_OWNER, TEAM_REFUSAL.LAST_OWNER],
    [MEMBERSHIP_REMOVAL_OUTCOME.NOT_FOUND, TEAM_REFUSAL.NOT_FOUND],
  ])(
    'answers %s with its refusal and changes nothing',
    async (outcome, reason) => {
      removeMembership.mockResolvedValue(outcome);

      expect(await remove()).toEqual({
        outcome: ACTION_OUTCOME.REFUSED,
        reason,
      });
      expect(revokeMemberStudioAccess).not.toHaveBeenCalled();
      expect(recordAuditEvent).not.toHaveBeenCalled();
    },
  );

  it('refuses a member already gone without removing anything', async () => {
    vi.mocked(memberships.listTenantMembers).mockResolvedValue([]);

    expect(await remove()).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: TEAM_REFUSAL.NOT_FOUND,
    });
    expect(removeMembership).not.toHaveBeenCalled();
  });

  it('refuses an id that is not a membership id', async () => {
    expect(await remove(MOCK_MEMBER_EMAIL)).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: TEAM_REFUSAL.NOT_FOUND,
    });
    expect(removeMembership).not.toHaveBeenCalled();
  });

  it('logs and fails when the removal throws', async () => {
    removeMembership.mockRejectedValue(new Error());

    expect(await remove()).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(logger.error).toHaveBeenCalledWith(
      TEAM_ACCESS_LOG.REMOVE_FAILED,
      expect.objectContaining({ membershipId: MOCK_MEMBER_ID }),
    );
  });
});
