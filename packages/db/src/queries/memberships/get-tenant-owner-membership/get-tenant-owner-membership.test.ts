import { faker } from '@faker-js/faker';
import type { TMaybeNull } from '@shinefold/config/types';
import { MEMBERSHIP_ROLE, type TMembershipRole } from '@shinefold/db/constants';
import { userPersonalColumns } from '@shinefold/db/queries/users/user-personal-data/user-personal-data';
import * as schema from '@shinefold/db/schema';
import { GITHUB_PROVIDER } from '@shinefold/db/testing/account/fixtures';
import {
  insertTestAccount,
  insertTestTenant,
  insertTestUser,
  MOCK_EMAIL_VERIFIED_AT,
  MOCK_OWNER_EMAIL,
} from '@shinefold/db/testing/fixtures';
import {
  MOCK_INVITE_CONSUMED_AT,
  mockMembershipInvite,
} from '@shinefold/db/testing/membership-invites/fixtures';
import {
  MOCK_EDITOR_EMAIL,
  mockMembership,
} from '@shinefold/db/testing/memberships/fixtures';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';
import { isNull } from '@shinefold/utils/primitives';

import { getTenantOwnerMembership } from './get-tenant-owner-membership';

vi.mock('@shinefold/db/client');

faker.seed(5765);

const db = useQueryTestDb();

const MOCK_SIGNED_IN_EMAIL = faker.internet.email().toLowerCase();
const MOCK_INVITED_EMAIL = faker.internet.email().toLowerCase();
const MOCK_MEMBER_USER_ID = faker.string.uuid();

afterEach(async () => {
  await db().delete(schema.memberships);
  await db().delete(schema.membershipInvites);
  await db().delete(schema.tenants);
  await db().delete(schema.users);
});

describe(getTenantOwnerMembership, () => {
  let tenantId: string;

  beforeEach(async () => {
    ({ id: tenantId } = await insertTestTenant(db()));
  });

  async function insertMember(
    email: TMaybeNull<string>,
    role: TMembershipRole,
    emailVerified: TMaybeNull<Date> = MOCK_EMAIL_VERIFIED_AT,
  ): Promise<schema.TMembership> {
    await insertTestUser(db(), {
      id: MOCK_MEMBER_USER_ID,
      emailVerified,
      ...(isNull(email) ? {} : userPersonalColumns({ email })),
    });
    return mockMembership(db(), {
      userId: MOCK_MEMBER_USER_ID,
      tenantId,
      role,
    });
  }

  async function insertInvite({
    email,
    role,
    consumedAt = null,
  }: {
    email: string;
    role: TMembershipRole;
    consumedAt?: TMaybeNull<Date>;
  }): Promise<schema.TMembershipInvite> {
    return mockMembershipInvite(db(), tenantId, { email, role, consumedAt });
  }

  it('returns a signed-in OWNER as joined, decrypted', async () => {
    const membership = await insertMember(
      MOCK_OWNER_EMAIL,
      MEMBERSHIP_ROLE.OWNER,
    );

    const result = await getTenantOwnerMembership(tenantId);

    expect(result).toEqual({
      email: MOCK_OWNER_EMAIL,
      hasSignedIn: true,
      joinedAt: membership.createdAt,
    });
  });

  describe('an OWNER account that has never signed in', () => {
    let membership: schema.TMembership;

    beforeEach(async () => {
      membership = await insertMember(
        MOCK_OWNER_EMAIL,
        MEMBERSHIP_ROLE.OWNER,
        null,
      );
    });

    it('is returned as invited', async () => {
      const result = await getTenantOwnerMembership(tenantId);

      expect(result).toEqual({
        email: MOCK_OWNER_EMAIL,
        hasSignedIn: false,
        invitedAt: membership.createdAt,
      });
    });

    it('counts a linked OAuth account as a sign-in', async () => {
      await insertTestAccount(db(), MOCK_MEMBER_USER_ID, GITHUB_PROVIDER);

      const result = await getTenantOwnerMembership(tenantId);

      expect(result).toEqual({
        email: MOCK_OWNER_EMAIL,
        hasSignedIn: true,
        joinedAt: membership.createdAt,
      });
    });
  });

  it('ignores a non-OWNER membership on the same tenant', async () => {
    await insertMember(MOCK_EDITOR_EMAIL, MEMBERSHIP_ROLE.EDITOR);

    const result = await getTenantOwnerMembership(tenantId);

    expect(result).toBeUndefined();
  });

  it('falls back to a pending OWNER invite, reading its encrypted email', async () => {
    const invite = await insertInvite({
      email: MOCK_OWNER_EMAIL,
      role: MEMBERSHIP_ROLE.OWNER,
    });

    const result = await getTenantOwnerMembership(tenantId);

    expect(result).toEqual({
      email: MOCK_OWNER_EMAIL,
      hasSignedIn: false,
      invitedAt: invite.createdAt,
    });
  });

  it('ignores an OWNER invite that has already been consumed', async () => {
    await insertInvite({
      email: MOCK_OWNER_EMAIL,
      role: MEMBERSHIP_ROLE.OWNER,
      consumedAt: MOCK_INVITE_CONSUMED_AT,
    });

    const result = await getTenantOwnerMembership(tenantId);

    expect(result).toBeUndefined();
  });

  it('ignores a non-OWNER invite on the same tenant', async () => {
    await insertInvite({
      email: MOCK_EDITOR_EMAIL,
      role: MEMBERSHIP_ROLE.EDITOR,
    });

    const result = await getTenantOwnerMembership(tenantId);

    expect(result).toBeUndefined();
  });

  it('prefers a real OWNER membership over a pending invite', async () => {
    const membership = await insertMember(
      MOCK_SIGNED_IN_EMAIL,
      MEMBERSHIP_ROLE.OWNER,
    );
    await insertInvite({
      email: MOCK_INVITED_EMAIL,
      role: MEMBERSHIP_ROLE.OWNER,
    });

    const result = await getTenantOwnerMembership(tenantId);

    expect(result).toEqual({
      email: MOCK_SIGNED_IN_EMAIL,
      hasSignedIn: true,
      joinedAt: membership.createdAt,
    });
  });

  it('returns undefined when the tenant has no OWNER membership or invite', async () => {
    const result = await getTenantOwnerMembership(tenantId);

    expect(result).toBeUndefined();
  });

  describe('a joined OWNER with no address', () => {
    beforeEach(async () => {
      await insertMember(null, MEMBERSHIP_ROLE.OWNER);
    });

    it('returns the pending invite', async () => {
      const invite = await insertInvite({
        email: MOCK_INVITED_EMAIL,
        role: MEMBERSHIP_ROLE.OWNER,
      });

      const result = await getTenantOwnerMembership(tenantId);

      expect(result).toEqual({
        email: MOCK_INVITED_EMAIL,
        hasSignedIn: false,
        invitedAt: invite.createdAt,
      });
    });

    it('returns undefined with no invite', async () => {
      const result = await getTenantOwnerMembership(tenantId);

      expect(result).toBeUndefined();
    });
  });
});
