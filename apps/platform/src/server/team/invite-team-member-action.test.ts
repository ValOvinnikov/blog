import {
  TEAM_ACCESS_LOG,
  TEAM_INVITE_FIELD_ERROR,
} from '@platform/constants/team-access';
import { recordAuditEvent } from '@platform/server/audit/record-audit-event';
import { signIn } from '@platform/server/auth/auth';
import { requireTenantMembership } from '@platform/server/auth/require-tenant-membership';
import {
  MOCK_AUTH_ERROR_URL,
  MOCK_VERIFY_REQUEST_URL,
} from '@platform/testing/auth/fixtures';
import { MOCK_NOT_AN_EMAIL } from '@platform/testing/data-requests/fixtures';
import {
  mockEditorMembershipContext,
  mockOperatorMembershipContext,
} from '@platform/testing/memberships/fixtures';
import {
  MOCK_INVITE_ID,
  MOCK_MEMBER_EMAIL,
  mockInviteRow,
  mockTenantMember,
} from '@platform/testing/team/fixtures';
import {
  MOCK_OWNER_EMAIL,
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
  MEMBERSHIP_INVITE_OUTCOME,
  MEMBERSHIP_ROLE,
} from '@shinefold/db/constants';

import { inviteTeamMemberAction } from './invite-team-member-action';

vi.hoisted(() => vi.stubEnv('SKIP_ENV_VALIDATION', 'true'));

vi.mock('@platform/server/auth/auth');

vi.mock('@platform/server/auth/require-tenant-membership');

vi.mock('@platform/server/audit/record-audit-event');

vi.mock('@shinefold/db', async () =>
  (await import('@platform/testing/team/fixtures')).mockTeamDb(),
);

const { memberships, membershipInvites } = queries;
const createInvite = vi.mocked(membershipInvites.createMembershipInvite);
const cancelInvite = vi.mocked(membershipInvites.cancelMembershipInvite);
const signInMock = vi.mocked(signIn);

const invite = (email = MOCK_MEMBER_EMAIL) =>
  inviteTeamMemberAction(MOCK_TENANT_ID, { email });

const emailError = (reason: string, email?: string) => ({
  outcome: ACTION_OUTCOME.INVALID,
  fieldErrors: { email: { reason, values: email ? { email } : undefined } },
});

describe(inviteTeamMemberAction, () => {
  beforeEach(() => {
    vi.mocked(memberships.listTenantMembers).mockResolvedValue([
      mockTenantMember({
        email: MOCK_OWNER_EMAIL,
        role: MEMBERSHIP_ROLE.OWNER,
      }),
    ]);
    signInMock.mockResolvedValue(MOCK_VERIFY_REQUEST_URL);
  });

  it('creates and emails one editor invite, audited without the address', async () => {
    const result = await invite();

    expect(createInvite).toHaveBeenCalledExactlyOnceWith(
      MOCK_TENANT_ID,
      MOCK_MEMBER_EMAIL,
      MEMBERSHIP_ROLE.EDITOR,
    );
    expect(signInMock).toHaveBeenCalledOnce();
    expect(recordAuditEvent).toHaveBeenCalledExactlyOnceWith({
      logEvent: TEAM_ACCESS_LOG.INVITE_AUDIT_FAILED,
      action: AUDIT_ACTION.MEMBER_INVITED,
      targetType: AUDIT_TARGET_TYPE.TEAM_MEMBER,
      targetId: MOCK_INVITE_ID,
      details: { role: MEMBERSHIP_ROLE.EDITOR },
    });
    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
  });

  it('trims and lower-cases the address before checking and storing it', async () => {
    await invite(` ${MOCK_MEMBER_EMAIL.toUpperCase()} `);

    expect(createInvite).toHaveBeenCalledExactlyOnceWith(
      MOCK_TENANT_ID,
      MOCK_MEMBER_EMAIL,
      MEMBERSHIP_ROLE.EDITOR,
    );
  });

  it('lets an operator invite on any tenant', async () => {
    vi.mocked(requireTenantMembership).mockResolvedValue(
      mockOperatorMembershipContext(mockReadyTenant()),
    );

    expect(await invite()).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
  });

  it('refuses an editor and writes nothing', async () => {
    vi.mocked(requireTenantMembership).mockResolvedValue(
      mockEditorMembershipContext(mockReadyTenant()),
    );

    await expect(invite()).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
    );
    expect(createInvite).not.toHaveBeenCalled();
    expect(signInMock).not.toHaveBeenCalled();
  });

  it('refuses a malformed address', async () => {
    expect(await invite(MOCK_NOT_AN_EMAIL)).toEqual(
      emailError(TEAM_INVITE_FIELD_ERROR.EMAIL_INVALID),
    );
    expect(createInvite).not.toHaveBeenCalled();
  });

  it("refuses a current member's address in any case and sends nothing", async () => {
    const result = await invite(MOCK_OWNER_EMAIL.toUpperCase());

    expect(result).toEqual(
      emailError(TEAM_INVITE_FIELD_ERROR.ALREADY_MEMBER, MOCK_OWNER_EMAIL),
    );
    expect(createInvite).not.toHaveBeenCalled();
    expect(signInMock).not.toHaveBeenCalled();
  });

  it.each([
    [
      MEMBERSHIP_INVITE_OUTCOME.ALREADY_CONSUMED,
      TEAM_INVITE_FIELD_ERROR.ALREADY_MEMBER,
    ],
    [
      MEMBERSHIP_INVITE_OUTCOME.ALREADY_PENDING,
      TEAM_INVITE_FIELD_ERROR.ALREADY_INVITED,
    ],
  ])('answers %s with %s and sends nothing', async (outcome, reason) => {
    createInvite.mockResolvedValue({ outcome, invite: mockInviteRow() });

    expect(await invite()).toEqual(emailError(reason, MOCK_MEMBER_EMAIL));
    expect(signInMock).not.toHaveBeenCalled();
    expect(recordAuditEvent).not.toHaveBeenCalled();
  });

  it('refuses an invite past the seat limit and sends nothing', async () => {
    createInvite.mockResolvedValue({
      outcome: MEMBERSHIP_INVITE_OUTCOME.SEAT_LIMIT,
    });

    expect(await invite()).toEqual(
      emailError(TEAM_INVITE_FIELD_ERROR.SEAT_LIMIT, MOCK_MEMBER_EMAIL),
    );
    expect(signInMock).not.toHaveBeenCalled();
  });

  it('logs a failed email once, cancels the invite and records nothing', async () => {
    signInMock.mockResolvedValue(MOCK_AUTH_ERROR_URL);

    const result = await invite();

    expect(vi.mocked(logger.error).mock.calls.map(([event]) => event)).toEqual([
      TEAM_ACCESS_LOG.INVITE_EMAIL_FAILED,
    ]);
    expect(cancelInvite).toHaveBeenCalledExactlyOnceWith(
      MOCK_TENANT_ID,
      MOCK_INVITE_ID,
    );
    expect(recordAuditEvent).not.toHaveBeenCalled();
    expect(result).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
  });

  it('logs and fails when the invite cannot be saved', async () => {
    createInvite.mockRejectedValue(new Error());

    expect(await invite()).toEqual({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    expect(logger.error).toHaveBeenCalledWith(
      TEAM_ACCESS_LOG.INVITE_FAILED,
      expect.objectContaining({ tenantId: MOCK_TENANT_ID }),
    );
  });
});
