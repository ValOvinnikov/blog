import {
  ELEVATE_TENANT_OWNER_OUTCOME,
  MEMBERSHIP_ROLE,
  SANITY_PROJECT_ROLE,
  TENANT_PROVISIONING_STEP,
  TENANT_PROVISIONING_STEP_STATUS,
} from '@blog/db/constants';
import type { TTenant } from '@blog/db/schema/tenants';
import { OWNER_STUDIO_ACCESS } from '@platform/constants/owner-studio-access';
import { buildVirtualAdminMembership } from '@platform/server/auth/build-virtual-admin-membership';
import { makeAdmin } from '@platform/testing/admins/fixtures';
import { makeMembership } from '@platform/testing/memberships/fixtures';
import {
  idleProvisioningSteps,
  makeReadyTenant,
} from '@platform/testing/tenants/fixtures';

import { ownerStudioAccessFor } from './owner-studio-access';

const owner = makeMembership();
const invitedAt = new Date('2026-10-18T09:00:00.000Z');
const acceptedAt = new Date('2026-10-18T10:00:00.000Z');
const sanityUserId = 'sanity-user-1';

const invitedTenant = (overrides: Partial<TTenant> = {}) =>
  makeReadyTenant({
    ownerInviteSentAt: invitedAt,
    ...overrides,
  });

const stalledSteps = {
  ...idleProvisioningSteps(),
  [TENANT_PROVISIONING_STEP.OWNER_ELEVATION]: {
    status: TENANT_PROVISIONING_STEP_STATUS.DONE,
    detail: ELEVATE_TENANT_OWNER_OUTCOME.STALLED,
  },
};

const joined = {
  ownerInviteAcceptedAt: acceptedAt,
  ownerSanityUserId: sanityUserId,
};

describe(ownerStudioAccessFor, () => {
  it('is INVITE_SENT while the invite waits for the owner', () => {
    expect(ownerStudioAccessFor(invitedTenant(), owner)).toBe(
      OWNER_STUDIO_ACCESS.INVITE_SENT,
    );
  });

  it('is STALLED once the owner check reports a stall', () => {
    const tenant = invitedTenant({ provisioningSteps: stalledSteps });

    expect(ownerStudioAccessFor(tenant, owner)).toBe(
      OWNER_STUDIO_ACCESS.STALLED,
    );
  });

  it('is ACTIVATING once the owner has joined but is not yet an administrator', () => {
    const tenant = invitedTenant({
      ...joined,
      ownerSanityRole: SANITY_PROJECT_ROLE.VIEWER,
    });

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

  it('does not apply to a tenant the worker never invited an owner for', () => {
    const tenant = invitedTenant({ ownerInviteSentAt: null });

    expect(ownerStudioAccessFor(tenant, owner)).toBeUndefined();
  });

  it('does not apply to an editor', () => {
    expect(
      ownerStudioAccessFor(
        invitedTenant(),
        makeMembership({ role: MEMBERSHIP_ROLE.EDITOR }),
      ),
    ).toBeUndefined();
  });

  it("does not apply to an admin viewing through a virtual owner's membership", () => {
    expect(
      ownerStudioAccessFor(
        invitedTenant(),
        buildVirtualAdminMembership(makeAdmin().userId, owner.tenantId),
      ),
    ).toBeUndefined();
  });
});
