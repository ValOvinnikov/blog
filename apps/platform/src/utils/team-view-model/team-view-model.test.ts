import { TEAM_ROW_ACCESS } from '@platform/constants/team-access';
import { mockAdmin } from '@platform/testing/admins/fixtures';
import {
  mockOperatorViewer,
  mockViewer,
} from '@platform/testing/memberships/fixtures';
import {
  MOCK_JOINED_AT,
  mockPendingInvite,
  mockTenantMember,
} from '@platform/testing/team/fixtures';
import {
  mockTeamOwner,
  mockTeamOwnerViewer,
  mockTeamViewModelInput,
} from '@platform/testing/team/team-view';
import { mockTenant } from '@platform/testing/tenants/mock-tenant';
import {
  DAY_MS,
  HOUR_MS,
} from '@platform/utils/format-relative-time/format-relative-time';
import { STUDIO_ACCESS, TENANT_PLAN } from '@shinefold/config/constants';
import { ADMIN_ROLE, MEMBERSHIP_ROLE } from '@shinefold/db/constants';

import { teamViewModel } from './team-view-model';

const MOCK_NOW = new Date(2026, 9, 2, 12, 0);
const MOCK_HOUR_AGO = new Date(MOCK_NOW.getTime() - HOUR_MS);
const MOCK_YESTERDAY = new Date(MOCK_NOW.getTime() - DAY_MS);
const MOCK_OWNER = mockTeamOwner();
const MOCK_GRACE_STARTED_AT = new Date(Date.UTC(2026, 9, 1, 15));
const MOCK_GRACE_ENDS_AT = new Date(Date.UTC(2026, 9, 15));

const modelFor = (
  overrides: Partial<Parameters<typeof teamViewModel>[0]> = {},
) =>
  teamViewModel(
    mockTeamViewModelInput({ members: [MOCK_OWNER], ...overrides }),
    MOCK_NOW,
  );

describe(teamViewModel, () => {
  it('counts members and pending invites, an owner invite too, as seats', () => {
    const { seats, shownUsed, isFull, freeSeats, invites } = modelFor({
      invites: [
        mockPendingInvite(),
        mockPendingInvite({
          inviteId: 'owner-invite',
          role: MEMBERSHIP_ROLE.OWNER,
        }),
      ],
    });

    expect({ seats, shownUsed, isFull, freeSeats }).toEqual({
      seats: 3,
      shownUsed: 3,
      isFull: true,
      freeSeats: 0,
    });
    expect(invites).toHaveLength(1);
  });

  it('caps the shown count at the seats once a downgrade leaves more in use', () => {
    const { shownUsed, isFull, freeSeats } = modelFor({
      members: [
        MOCK_OWNER,
        mockTenantMember({ membershipId: 'a' }),
        mockTenantMember({ membershipId: 'b', lockedAt: MOCK_JOINED_AT }),
        mockTenantMember({ membershipId: 'c', lockedAt: MOCK_JOINED_AT }),
      ],
    });

    expect({ shownUsed, isFull, freeSeats }).toEqual({
      shownUsed: 3,
      isFull: true,
      freeSeats: 0,
    });
  });

  it('counts the people over the seats and the grace deadline after a move down', () => {
    const { seatsOver, graceEndsAt } = modelFor({
      tenant: mockTenant({
        plan: TENANT_PLAN.STARTER,
        downgradeGraceStartedAt: MOCK_GRACE_STARTED_AT,
      }),
      members: [MOCK_OWNER, mockTenantMember({ membershipId: 'a' })],
      invites: [mockPendingInvite()],
    });

    expect({ seatsOver, graceEndsAt }).toEqual({
      seatsOver: 2,
      graceEndsAt: MOCK_GRACE_ENDS_AT,
    });
  });

  it('counts no one over the seats and no deadline within the seats', () => {
    const { seatsOver, graceEndsAt } = modelFor();

    expect({ seatsOver, graceEndsAt }).toEqual({
      seatsOver: 0,
      graceEndsAt: undefined,
    });
  });

  it.each([
    ['a locked editor', { lockedAt: MOCK_JOINED_AT }, TEAM_ROW_ACCESS.LOCKED],
    ['a reader', { role: MEMBERSHIP_ROLE.READER }, TEAM_ROW_ACCESS.NO_ACCESS],
    ['a just-joined editor', {}, STUDIO_ACCESS.ACTIVATING],
    [
      'an editor whose invite stalled',
      { studioAccess: STUDIO_ACCESS.STALLED },
      STUDIO_ACCESS.STALLED,
    ],
  ] as const)('reads the Studio access of %s', (_label, overrides, access) => {
    const { members } = modelFor({
      members: [MOCK_OWNER, mockTenantMember(overrides)],
    });

    expect(members[1]?.access).toBe(access);
  });

  it("reads the owner's row from the tenant's owner access", () => {
    const { members } = modelFor({
      tenant: mockTenant({
        plan: TENANT_PLAN.GROWTH,
        ownerInviteSentAt: MOCK_HOUR_AGO,
      }),
    });

    expect(members[0]?.access).toBe(STUDIO_ACCESS.INVITE_SENT);
  });

  it('offers Check now and Resend only to the owner and a SUPERADMIN', () => {
    const editor = mockTenantMember({
      studioAccess: STUDIO_ACCESS.INVITE_SENT,
    });
    const canRequestFor = (viewer: ReturnType<typeof mockTeamOwnerViewer>) =>
      modelFor({ viewer, members: [MOCK_OWNER, editor] }).members[1]
        ?.canRequestAccess;

    expect(canRequestFor(mockTeamOwnerViewer())).toBe(true);
    expect(canRequestFor(mockOperatorViewer(ADMIN_ROLE.SUPERADMIN))).toBe(true);
    expect(canRequestFor(mockOperatorViewer(ADMIN_ROLE.MODERATOR))).toBe(false);
  });

  it('offers no Studio buttons on a member with no address', () => {
    const { members } = modelFor({
      members: [MOCK_OWNER, mockTenantMember({ email: undefined })],
    });

    expect(members[1]?.canRequestAccess).toBe(false);
  });

  it('marks your own row and offers no Remove on it or on the last owner', () => {
    const { members } = modelFor({
      members: [MOCK_OWNER, mockTenantMember()],
    });

    expect(
      members.map(({ isYou, canRemove }) => ({ isYou, canRemove })),
    ).toEqual([
      { isYou: true, canRemove: false },
      { isYou: false, canRemove: true },
    ]);
  });

  it('never marks a row as your own for an operator', () => {
    const { members } = modelFor({
      viewer: mockViewer({ admin: mockAdmin({ role: ADMIN_ROLE.SUPERADMIN }) }),
    });

    expect(members[0]?.isYou).toBe(false);
  });

  it('tells a join today from an earlier one by the calendar day', () => {
    const { members } = modelFor({
      members: [
        mockTenantMember({ membershipId: 'today', joinedAt: MOCK_HOUR_AGO }),
        mockTenantMember({ membershipId: 'earlier', joinedAt: MOCK_YESTERDAY }),
      ],
    });

    expect(members.map(({ isJoinedToday }) => isJoinedToday)).toEqual([
      true,
      false,
    ]);
  });

  it('notes whether the team has an editor yet', () => {
    expect(modelFor().hasEditor).toBe(false);
    expect(
      modelFor({ members: [MOCK_OWNER, mockTenantMember()] }).hasEditor,
    ).toBe(true);
  });
});
