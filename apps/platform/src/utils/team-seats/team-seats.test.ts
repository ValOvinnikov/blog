import { MOCK_GRACE_STARTED_AT } from '@platform/testing/billing/grace';
import {
  MOCK_JOINED_AT,
  MOCK_MEMBER_EMAIL,
  mockTenantMember,
} from '@platform/testing/team/fixtures';
import { mockTeamOwner } from '@platform/testing/team/team-view';
import { mockTenant } from '@platform/testing/tenants/mock-tenant';
import { TENANT_PLAN } from '@shinefold/config/constants';

import { teamSeats } from './team-seats';

const MOCK_LATER_EMAIL = 'later@example.com';
const MOCK_OWNER = mockTeamOwner();
const MOCK_GRACE_TENANT = mockTenant({
  plan: TENANT_PLAN.FREE,
  downgradeGraceStartedAt: MOCK_GRACE_STARTED_AT,
});

describe(teamSeats, () => {
  it('names the unlocked members past the seats while a grace runs, in seat order', () => {
    const { emailsLosingAccess } = teamSeats({
      tenant: MOCK_GRACE_TENANT,
      members: [
        MOCK_OWNER,
        mockTenantMember({ membershipId: 'a' }),
        mockTenantMember({
          membershipId: 'b',
          email: MOCK_LATER_EMAIL,
        }),
      ],
      invites: [],
    });

    expect(emailsLosingAccess).toEqual([MOCK_MEMBER_EMAIL, MOCK_LATER_EMAIL]);
  });

  it('keeps an address-less member in the list as a gap to name', () => {
    const { emailsLosingAccess } = teamSeats({
      tenant: MOCK_GRACE_TENANT,
      members: [MOCK_OWNER, mockTenantMember({ email: undefined })],
      invites: [],
    });

    expect(emailsLosingAccess).toEqual([undefined]);
  });

  it('names no one with no grace running', () => {
    const { emailsLosingAccess } = teamSeats({
      tenant: mockTenant({ plan: TENANT_PLAN.STARTER }),
      members: [MOCK_OWNER, mockTenantMember()],
      invites: [],
    });

    expect(emailsLosingAccess).toEqual([]);
  });

  it('counts the locked members, who name no one once the lock has run', () => {
    const { lockedCount, emailsLosingAccess, seatsOver } = teamSeats({
      tenant: MOCK_GRACE_TENANT,
      members: [
        MOCK_OWNER,
        mockTenantMember({ membershipId: 'a', lockedAt: MOCK_JOINED_AT }),
        mockTenantMember({ membershipId: 'b', lockedAt: MOCK_JOINED_AT }),
      ],
      invites: [],
    });

    expect({ lockedCount, emailsLosingAccess, seatsOver }).toEqual({
      lockedCount: 2,
      emailsLosingAccess: [],
      seatsOver: 0,
    });
  });
});
