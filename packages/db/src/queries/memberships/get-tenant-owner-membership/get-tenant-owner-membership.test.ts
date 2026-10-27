import type { TMaybeNull } from '@blog/config/types';
import {
  MEMBERSHIP_ROLE,
  PERSONAL_DATA_FALLBACK_REASON,
  PERSONAL_DATA_OWNER,
  type TMembershipRole,
} from '@blog/db/constants';
import { userPersonalColumns } from '@blog/db/queries/users/user-personal-data/user-personal-data';
import * as schema from '@blog/db/schema';
import {
  insertTestAccount,
  insertTestTenant,
  insertTestUser,
  MOCK_EMAIL_VERIFIED_AT,
  MOCK_OAUTH_PROVIDER,
  MOCK_OWNER_EMAIL,
} from '@blog/db/testing/fixtures';
import {
  MOCK_INVITE_CONSUMED_AT,
  mockMembershipInvite,
} from '@blog/db/testing/membership-invites/fixtures';
import { mockMembership } from '@blog/db/testing/memberships/fixtures';
import {
  usePersonalDataFallbackListener,
  usePersonalDataKeys,
} from '@blog/db/testing/personal-data';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { encryptPersonalValue } from '@blog/db/utils/personal-data/personal-data';
import { isNull } from '@blog/utils/primitives';
import { faker } from '@faker-js/faker';

import { getTenantOwnerMembership } from './get-tenant-owner-membership';

vi.mock('@blog/db/client');

faker.seed(5765);

const db = useQueryTestDb();
usePersonalDataKeys();
const fallbackListener = usePersonalDataFallbackListener();

const MOCK_EDITOR_EMAIL = faker.internet.email().toLowerCase();
const MOCK_SIGNED_IN_EMAIL = faker.internet.email().toLowerCase();
const MOCK_INVITED_EMAIL = faker.internet.email().toLowerCase();
const MOCK_STALE_PLAIN_EMAIL = faker.internet.email().toLowerCase();
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
    encryptedEmail,
    role,
    consumedAt = null,
  }: {
    email: string;
    encryptedEmail: string;
    role: TMembershipRole;
    consumedAt?: TMaybeNull<Date>;
  }): Promise<schema.TMembershipInvite> {
    return mockMembershipInvite(db(), tenantId, {
      email,
      emailEncrypted: encryptPersonalValue(encryptedEmail),
      role,
      consumedAt,
    });
  }

  it('returns a signed-in OWNER as joined, decrypted and without a notice', async () => {
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
    expect(fallbackListener).not.toHaveBeenCalled();
  });

  it('reads a joined OWNER not yet backfilled from the plain email, and reports it', async () => {
    await insertTestUser(db(), {
      id: MOCK_MEMBER_USER_ID,
      email: MOCK_OWNER_EMAIL,
      emailVerified: MOCK_EMAIL_VERIFIED_AT,
    });
    const membership = await mockMembership(db(), {
      userId: MOCK_MEMBER_USER_ID,
      tenantId,
    });

    const result = await getTenantOwnerMembership(tenantId);

    expect(result).toEqual({
      email: MOCK_OWNER_EMAIL,
      hasSignedIn: true,
      joinedAt: membership.createdAt,
    });
    expect(fallbackListener).toHaveBeenCalledExactlyOnceWith({
      owner: PERSONAL_DATA_OWNER.USER,
      reason: PERSONAL_DATA_FALLBACK_REASON.NOT_BACKFILLED,
    });
  });

  it('returns an OWNER account that has never signed in as invited', async () => {
    const membership = await insertMember(
      MOCK_OWNER_EMAIL,
      MEMBERSHIP_ROLE.OWNER,
      null,
    );

    const result = await getTenantOwnerMembership(tenantId);

    expect(result).toEqual({
      email: MOCK_OWNER_EMAIL,
      hasSignedIn: false,
      invitedAt: membership.createdAt,
    });
  });

  it('counts a linked OAuth account as a sign-in', async () => {
    const membership = await insertMember(
      MOCK_OWNER_EMAIL,
      MEMBERSHIP_ROLE.OWNER,
      null,
    );
    await insertTestAccount(db(), MOCK_MEMBER_USER_ID, MOCK_OAUTH_PROVIDER);

    const result = await getTenantOwnerMembership(tenantId);

    expect(result).toEqual({
      email: MOCK_OWNER_EMAIL,
      hasSignedIn: true,
      joinedAt: membership.createdAt,
    });
  });

  it('ignores a non-OWNER membership on the same tenant', async () => {
    await insertMember(MOCK_EDITOR_EMAIL, MEMBERSHIP_ROLE.EDITOR);

    const result = await getTenantOwnerMembership(tenantId);

    expect(result).toBeUndefined();
  });

  it('falls back to a pending OWNER invite, reading its encrypted email', async () => {
    const invite = await insertInvite({
      email: MOCK_STALE_PLAIN_EMAIL,
      encryptedEmail: MOCK_OWNER_EMAIL,
      role: MEMBERSHIP_ROLE.OWNER,
    });

    const result = await getTenantOwnerMembership(tenantId);

    expect(result).toEqual({
      email: MOCK_OWNER_EMAIL,
      hasSignedIn: false,
      invitedAt: invite.createdAt,
    });
  });

  it('reads a pending OWNER invite not yet backfilled from plain, and reports it', async () => {
    const invite = await mockMembershipInvite(db(), tenantId, {
      email: MOCK_OWNER_EMAIL,
    });

    const result = await getTenantOwnerMembership(tenantId);

    expect(result).toEqual({
      email: MOCK_OWNER_EMAIL,
      hasSignedIn: false,
      invitedAt: invite.createdAt,
    });
    expect(fallbackListener).toHaveBeenCalledExactlyOnceWith({
      owner: PERSONAL_DATA_OWNER.INVITE,
      reason: PERSONAL_DATA_FALLBACK_REASON.NOT_BACKFILLED,
    });
  });

  it('ignores an OWNER invite that has already been consumed', async () => {
    await insertInvite({
      email: MOCK_OWNER_EMAIL,
      encryptedEmail: MOCK_OWNER_EMAIL,
      role: MEMBERSHIP_ROLE.OWNER,
      consumedAt: MOCK_INVITE_CONSUMED_AT,
    });

    const result = await getTenantOwnerMembership(tenantId);

    expect(result).toBeUndefined();
  });

  it('ignores a non-OWNER invite on the same tenant', async () => {
    await insertInvite({
      email: MOCK_EDITOR_EMAIL,
      encryptedEmail: MOCK_EDITOR_EMAIL,
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
      encryptedEmail: MOCK_INVITED_EMAIL,
      role: MEMBERSHIP_ROLE.OWNER,
    });

    const result = await getTenantOwnerMembership(tenantId);

    expect(result).toEqual({
      email: MOCK_SIGNED_IN_EMAIL,
      hasSignedIn: true,
      joinedAt: membership.createdAt,
    });
  });

  it('returns the pending invite when the joined OWNER has no address', async () => {
    await insertMember(null, MEMBERSHIP_ROLE.OWNER);
    const invite = await insertInvite({
      email: MOCK_INVITED_EMAIL,
      encryptedEmail: MOCK_INVITED_EMAIL,
      role: MEMBERSHIP_ROLE.OWNER,
    });

    const result = await getTenantOwnerMembership(tenantId);

    expect(result).toEqual({
      email: MOCK_INVITED_EMAIL,
      hasSignedIn: false,
      invitedAt: invite.createdAt,
    });
    expect(fallbackListener).not.toHaveBeenCalled();
  });

  it('returns undefined when the tenant has no OWNER membership or invite', async () => {
    const result = await getTenantOwnerMembership(tenantId);

    expect(result).toBeUndefined();
  });

  it('returns undefined when the joined OWNER has no address and no invite', async () => {
    await insertMember(null, MEMBERSHIP_ROLE.OWNER);

    const result = await getTenantOwnerMembership(tenantId);

    expect(result).toBeUndefined();
  });
});
