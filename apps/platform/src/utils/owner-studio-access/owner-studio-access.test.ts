import {
  ELEVATE_TENANT_OWNER_OUTCOME,
  MEMBERSHIP_ROLE,
  OWNER_ACCESS_STALL_AFTER_MS,
  SANITY_PROJECT_ROLE,
  TENANT_PROVISIONING_STEP,
  TENANT_PROVISIONING_STEP_STATUS,
} from '@blog/db/constants';
import type {
  TTenant,
  TTenantProvisioningState,
} from '@blog/db/schema/tenants';
import { OWNER_STUDIO_ACCESS } from '@platform/constants/owner-studio-access';
import { buildVirtualAdminMembership } from '@platform/server/auth/build-virtual-admin-membership';
import { mockAdmin } from '@platform/testing/admins/fixtures';
import { mockMembership } from '@platform/testing/memberships/fixtures';
import {
  mockIdleProvisioningSteps,
  mockReadyTenant,
} from '@platform/testing/tenants/fixtures';

import { ownerStudioAccessFor } from './owner-studio-access';

const owner = mockMembership();
const invitedAt = new Date('2026-10-18T09:00:00.000Z');
const acceptedAt = new Date('2026-10-18T10:00:00.000Z');
const beforeStall = new Date(
  invitedAt.getTime() + OWNER_ACCESS_STALL_AFTER_MS - 1,
);
const atStall = new Date(invitedAt.getTime() + OWNER_ACCESS_STALL_AFTER_MS);
const sanityUserId = 'sanity-user-1';

const invitedTenant = (overrides: Partial<TTenant> = {}) =>
  mockReadyTenant({
    ownerInviteSentAt: invitedAt,
    ...overrides,
  });

const ownerCheckSteps = (detail: string) =>
  ({
    ...mockIdleProvisioningSteps(),
    [TENANT_PROVISIONING_STEP.OWNER_ELEVATION]: {
      status: TENANT_PROVISIONING_STEP_STATUS.DONE,
      detail,
    },
  }) as TTenantProvisioningState;

const stalledSteps = ownerCheckSteps(ELEVATE_TENANT_OWNER_OUTCOME.STALLED);

const joined = {
  ownerInviteAcceptedAt: acceptedAt,
  ownerSanityUserId: sanityUserId,
};

describe(ownerStudioAccessFor, () => {
  it('is INVITE_SENT while the invite waits for the owner', () => {
    expect(ownerStudioAccessFor(invitedTenant(), owner, beforeStall)).toBe(
      OWNER_STUDIO_ACCESS.INVITE_SENT,
    );
  });

  it('is STALLED once the owner check reports a stall', () => {
    const tenant = invitedTenant({ provisioningSteps: stalledSteps });

    expect(ownerStudioAccessFor(tenant, owner)).toBe(
      OWNER_STUDIO_ACCESS.STALLED,
    );
  });

  it('is ACTIVATING while the Sanity user is known but acceptance is not recorded', () => {
    const tenant = invitedTenant({ ownerSanityUserId: sanityUserId });

    expect(ownerStudioAccessFor(tenant, owner)).toBe(
      OWNER_STUDIO_ACCESS.ACTIVATING,
    );
  });

  it('is READY once the owner is recorded as an administrator', () => {
    const tenant = invitedTenant({
      ...joined,
      ownerSanityRole: SANITY_PROJECT_ROLE.ADMINISTRATOR,
      provisioningSteps: stalledSteps,
    });

    expect(ownerStudioAccessFor(tenant, owner)).toBe(OWNER_STUDIO_ACCESS.READY);
  });

  it.each([SANITY_PROJECT_ROLE.VIEWER, null])(
    'stays READY after the recorded Sanity role changes to %s',
    (ownerSanityRole) => {
      const tenant = invitedTenant({ ...joined, ownerSanityRole });

      expect(ownerStudioAccessFor(tenant, owner)).toBe(
        OWNER_STUDIO_ACCESS.READY,
      );
    },
  );

  it.each([
    { record: 'no recorded', provisioningSteps: mockIdleProvisioningSteps() },
    {
      record: 'an unrecognised',
      provisioningSteps: ownerCheckSteps('NOT_AN_OUTCOME'),
    },
  ])(
    'is STALLED once the invite reaches the stall threshold with $record owner check outcome',
    ({ provisioningSteps }) => {
      const tenant = invitedTenant({ provisioningSteps });

      expect(ownerStudioAccessFor(tenant, owner, atStall)).toBe(
        OWNER_STUDIO_ACCESS.STALLED,
      );
      expect(ownerStudioAccessFor(tenant, owner, beforeStall)).toBe(
        OWNER_STUDIO_ACCESS.INVITE_SENT,
      );
    },
  );

  it('trusts a recorded owner check over the invite age', () => {
    const tenant = invitedTenant({
      provisioningSteps: ownerCheckSteps(
        ELEVATE_TENANT_OWNER_OUTCOME.PENDING_ACCEPTANCE,
      ),
    });

    expect(ownerStudioAccessFor(tenant, owner, atStall)).toBe(
      OWNER_STUDIO_ACCESS.INVITE_SENT,
    );
  });

  it('does not apply to a tenant the worker never invited an owner for', () => {
    const tenant = invitedTenant({ ownerInviteSentAt: null });

    expect(ownerStudioAccessFor(tenant, owner)).toBeUndefined();
  });

  it('does not apply to an editor', () => {
    expect(
      ownerStudioAccessFor(
        invitedTenant(),
        mockMembership({ role: MEMBERSHIP_ROLE.EDITOR }),
      ),
    ).toBeUndefined();
  });

  it("does not apply to an admin viewing through a virtual owner's membership", () => {
    expect(
      ownerStudioAccessFor(
        invitedTenant(),
        buildVirtualAdminMembership(mockAdmin().userId, owner.tenantId),
      ),
    ).toBeUndefined();
  });
});
