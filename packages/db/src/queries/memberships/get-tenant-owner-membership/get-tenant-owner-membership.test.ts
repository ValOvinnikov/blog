import type { TMaybeNull } from '@blog/config/types';
import {
  MEMBERSHIP_ROLE,
  PERSONAL_DATA_FALLBACK_REASON,
  PERSONAL_DATA_OWNER,
  type TMembershipRole,
} from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import {
  MOCK_EMAIL_VERIFIED_AT,
  MOCK_OAUTH_PROVIDER,
  MOCK_OWNER_EMAIL,
  insertTestAccount,
  insertTestTenant,
  insertTestUser,
} from '@blog/db/testing/fixtures';
import {
  usePersonalDataFallbackListener,
  usePersonalDataKeys,
} from '@blog/db/testing/personal-data';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { encryptPersonalValue } from '@blog/db/utils/personal-data/personal-data';
import { faker } from '@faker-js/faker';

import { getTenantOwnerMembership } from './get-tenant-owner-membership';

vi.mock('@blog/db/client');

const db = useQueryTestDb();
usePersonalDataKeys();
const fallbackListener = usePersonalDataFallbackListener();

const EDITOR_EMAIL = 'editor@example.com';
const SIGNED_IN_EMAIL = 'signed-in@example.com';
const INVITED_EMAIL = 'invited@example.com';
const MEMBER_USER_ID = 'user-1';

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
    await insertTestUser(db(), { id: MEMBER_USER_ID, email, emailVerified });
    const [membership] = await db()
      .insert(schema.memberships)
      .values({ userId: MEMBER_USER_ID, tenantId, role })
      .returning();
    if (!membership) throw new Error('failed to seed a membership row');
    return membership;
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
    const [invite] = await db()
      .insert(schema.membershipInvites)
      .values({
        tenantId,
        email,
        emailEncrypted: encryptPersonalValue(encryptedEmail),
        role,
        consumedAt,
      })
      .returning();
    if (!invite) throw new Error('failed to seed an invite row');
    return invite;
  }

  it('returns a signed-in OWNER as joined when the membership row was made', async () => {
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
    await insertTestAccount(db(), MEMBER_USER_ID, MOCK_OAUTH_PROVIDER);

    const result = await getTenantOwnerMembership(tenantId);

    expect(result).toEqual({
      email: MOCK_OWNER_EMAIL,
      hasSignedIn: true,
      joinedAt: membership.createdAt,
    });
  });

  it('ignores a non-OWNER membership on the same tenant', async () => {
    await insertMember(EDITOR_EMAIL, MEMBERSHIP_ROLE.EDITOR);

    const result = await getTenantOwnerMembership(tenantId);

    expect(result).toBeUndefined();
  });

  it('falls back to a pending OWNER invite, reading its encrypted email', async () => {
    const invite = await insertInvite({
      email: faker.internet.email(),
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

  it('reads a pending OWNER invite not yet backfilled from its plain email, and reports it', async () => {
    await db().insert(schema.membershipInvites).values({
      tenantId,
      email: MOCK_OWNER_EMAIL,
      role: MEMBERSHIP_ROLE.OWNER,
    });

    const result = await getTenantOwnerMembership(tenantId);

    expect(result).toMatchObject({
      email: MOCK_OWNER_EMAIL,
      hasSignedIn: false,
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
      consumedAt: new Date('2026-08-12T00:00:00.000Z'),
    });

    const result = await getTenantOwnerMembership(tenantId);

    expect(result).toBeUndefined();
  });

  it('ignores a non-OWNER invite on the same tenant', async () => {
    await insertInvite({
      email: EDITOR_EMAIL,
      encryptedEmail: EDITOR_EMAIL,
      role: MEMBERSHIP_ROLE.EDITOR,
    });

    const result = await getTenantOwnerMembership(tenantId);

    expect(result).toBeUndefined();
  });

  it('prefers a real OWNER membership over a pending invite', async () => {
    const membership = await insertMember(
      SIGNED_IN_EMAIL,
      MEMBERSHIP_ROLE.OWNER,
    );
    await insertInvite({
      email: INVITED_EMAIL,
      encryptedEmail: INVITED_EMAIL,
      role: MEMBERSHIP_ROLE.OWNER,
    });

    const result = await getTenantOwnerMembership(tenantId);

    expect(result).toEqual({
      email: SIGNED_IN_EMAIL,
      hasSignedIn: true,
      joinedAt: membership.createdAt,
    });
  });

  it('returns undefined when the tenant has no OWNER membership or invite', async () => {
    const result = await getTenantOwnerMembership(tenantId);

    expect(result).toBeUndefined();
  });

  it('returns undefined when the owner user has no email on file and no invite is pending', async () => {
    await insertMember(null, MEMBERSHIP_ROLE.OWNER);

    const result = await getTenantOwnerMembership(tenantId);

    expect(result).toBeUndefined();
  });
});
