import type { TMembership } from '@blog/db/schema/memberships';
import type { TTenant } from '@blog/db/schema/tenants';
import { buildVirtualAdminMembership } from '@platform/server/auth/build-virtual-admin-membership';
import {
  idleProvisioningSteps,
  makeReadyTenant,
} from '@platform/testing/tenants/fixtures';

import { ownerStudioAccessFor } from './owner-studio-access';

const owner: TMembership = {
  id: '6a1b2c3d-0000-4000-8000-000000000001',
  userId: 'user-1',
  tenantId: 'tenant-1',
  role: 'OWNER',
  createdAt: new Date('2026-10-01T00:00:00.000Z'),
};

const invitedTenant = (overrides: Partial<TTenant> = {}) =>
  makeReadyTenant({
    ownerInviteSentAt: new Date('2026-10-18T09:00:00.000Z'),
    ...overrides,
  });

const stalledSteps = {
  ...idleProvisioningSteps(),
  OWNER_ELEVATION: { status: 'DONE', detail: 'STALLED' },
} as const;

const joined = {
  ownerInviteAcceptedAt: new Date('2026-10-18T10:00:00.000Z'),
  ownerSanityUserId: 'sanity-user-1',
};

describe(ownerStudioAccessFor, () => {
  it('is INVITE_SENT while the invite waits for the owner', () => {
    expect(ownerStudioAccessFor(invitedTenant(), owner)).toBe('INVITE_SENT');
  });

  it('is STALLED once the owner check reports a stall', () => {
    const tenant = invitedTenant({ provisioningSteps: stalledSteps });

    expect(ownerStudioAccessFor(tenant, owner)).toBe('STALLED');
  });

  it('is ACTIVATING once the owner has joined but is not yet an administrator', () => {
    const tenant = invitedTenant({ ...joined, ownerSanityRole: 'VIEWER' });

    expect(ownerStudioAccessFor(tenant, owner)).toBe('ACTIVATING');
  });

  it('is READY once the owner is recorded as an administrator', () => {
    const tenant = invitedTenant({
      ...joined,
      ownerSanityRole: 'ADMINISTRATOR',
      provisioningSteps: stalledSteps,
    });

    expect(ownerStudioAccessFor(tenant, owner)).toBe('READY');
  });

  it('does not apply to a tenant the worker never invited an owner for', () => {
    const tenant = invitedTenant({ ownerInviteSentAt: null });

    expect(ownerStudioAccessFor(tenant, owner)).toBeUndefined();
  });

  it('does not apply to an editor', () => {
    expect(
      ownerStudioAccessFor(invitedTenant(), { ...owner, role: 'EDITOR' }),
    ).toBeUndefined();
  });

  it("does not apply to an admin viewing through a virtual owner's membership", () => {
    expect(
      ownerStudioAccessFor(
        invitedTenant(),
        buildVirtualAdminMembership('admin-user', 'tenant-1'),
      ),
    ).toBeUndefined();
  });
});
