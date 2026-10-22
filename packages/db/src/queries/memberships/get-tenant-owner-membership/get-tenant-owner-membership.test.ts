import { MEMBERSHIP_ROLE } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { insertTestTenant, insertTestUser } from '@blog/db/testing/fixtures';
import { usePersonalDataKeys } from '@blog/db/testing/personal-data';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { encryptPersonalValue } from '@blog/db/utils/personal-data/personal-data';
import { faker } from '@faker-js/faker';

import { getTenantOwnerMembership } from './get-tenant-owner-membership';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);
usePersonalDataKeys();

const OWNER_EMAIL = 'owner@example.com';
const EDITOR_EMAIL = 'editor@example.com';
const SIGNED_IN_EMAIL = 'signed-in@example.com';
const INVITED_EMAIL = 'invited@example.com';

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

  it('returns the OWNER membership email and joinedAt for the tenant', async () => {
    await insertTestUser(db(), { id: 'user-1', email: OWNER_EMAIL });
    const [membership] = await db()
      .insert(schema.memberships)
      .values({
        userId: 'user-1',
        tenantId,
        role: MEMBERSHIP_ROLE.OWNER,
      })
      .returning();

    const result = await getTenantOwnerMembership(tenantId);

    expect(result).toEqual({
      email: OWNER_EMAIL,
      joinedAt: membership!.createdAt,
    });
  });

  it('ignores a non-OWNER membership on the same tenant', async () => {
    await insertTestUser(db(), { id: 'user-1', email: EDITOR_EMAIL });
    await db().insert(schema.memberships).values({
      userId: 'user-1',
      tenantId,
      role: MEMBERSHIP_ROLE.EDITOR,
    });

    const result = await getTenantOwnerMembership(tenantId);

    expect(result).toBeUndefined();
  });

  it('falls back to a pending OWNER invite with its email and no join date', async () => {
    await db()
      .insert(schema.membershipInvites)
      .values({
        tenantId,
        email: OWNER_EMAIL,
        emailEncrypted: encryptPersonalValue(OWNER_EMAIL),
        role: MEMBERSHIP_ROLE.OWNER,
      });

    const result = await getTenantOwnerMembership(tenantId);

    expect(result).toEqual({ email: OWNER_EMAIL });
  });

  it("reads the pending invite's encrypted email rather than the plain column", async () => {
    await db()
      .insert(schema.membershipInvites)
      .values({
        tenantId,
        email: faker.internet.email(),
        emailEncrypted: encryptPersonalValue(OWNER_EMAIL),
        role: MEMBERSHIP_ROLE.OWNER,
      });

    const result = await getTenantOwnerMembership(tenantId);

    expect(result).toEqual({ email: OWNER_EMAIL });
  });

  it('ignores an OWNER invite that has already been consumed', async () => {
    await db()
      .insert(schema.membershipInvites)
      .values({
        tenantId,
        email: OWNER_EMAIL,
        emailEncrypted: encryptPersonalValue(OWNER_EMAIL),
        role: MEMBERSHIP_ROLE.OWNER,
        consumedAt: new Date('2026-08-12T00:00:00.000Z'),
      });

    const result = await getTenantOwnerMembership(tenantId);

    expect(result).toBeUndefined();
  });

  it('ignores a non-OWNER invite on the same tenant', async () => {
    await db()
      .insert(schema.membershipInvites)
      .values({
        tenantId,
        email: EDITOR_EMAIL,
        emailEncrypted: encryptPersonalValue(EDITOR_EMAIL),
        role: MEMBERSHIP_ROLE.EDITOR,
      });

    const result = await getTenantOwnerMembership(tenantId);

    expect(result).toBeUndefined();
  });

  it('prefers a real OWNER membership over a pending invite', async () => {
    await insertTestUser(db(), {
      id: 'user-1',
      email: SIGNED_IN_EMAIL,
    });
    const [membership] = await db()
      .insert(schema.memberships)
      .values({ userId: 'user-1', tenantId, role: MEMBERSHIP_ROLE.OWNER })
      .returning();
    await db()
      .insert(schema.membershipInvites)
      .values({
        tenantId,
        email: INVITED_EMAIL,
        emailEncrypted: encryptPersonalValue(INVITED_EMAIL),
        role: MEMBERSHIP_ROLE.OWNER,
      });

    const result = await getTenantOwnerMembership(tenantId);

    expect(result).toEqual({
      email: SIGNED_IN_EMAIL,
      joinedAt: membership!.createdAt,
    });
  });

  it('returns undefined when the tenant has no OWNER membership or invite', async () => {
    const result = await getTenantOwnerMembership(tenantId);

    expect(result).toBeUndefined();
  });

  it('returns undefined when the owner user has no email on file and no invite is pending', async () => {
    await insertTestUser(db(), { id: 'user-1', email: null });
    await db().insert(schema.memberships).values({
      userId: 'user-1',
      tenantId,
      role: MEMBERSHIP_ROLE.OWNER,
    });

    const result = await getTenantOwnerMembership(tenantId);

    expect(result).toBeUndefined();
  });
});
