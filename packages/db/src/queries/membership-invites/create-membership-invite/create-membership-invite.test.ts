import { MEMBERSHIP_ROLE } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { createTestDb } from '@blog/db/testing/create-test-db';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { eq } from 'drizzle-orm';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

import { createMembershipInvite } from './create-membership-invite';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

let db: PgliteDatabase<typeof schema>;

beforeAll(async () => {
  db = await createTestDb();
}, 30_000);

beforeEach(() => {
  getDbMock.mockReturnValue(db);
});

afterEach(async () => {
  await db.delete(schema.membershipInvites);
  await db.delete(schema.tenants);
});

describe(createMembershipInvite, () => {
  it('inserts a new pending invite, normalizing the email', async () => {
    const { id: tenantId } = await insertTestTenant(db);

    const result = await createMembershipInvite(
      tenantId,
      'Owner@Example.com',
      MEMBERSHIP_ROLE.OWNER,
    );

    expect(result.outcome).toBe('created');
    expect(result.invite).toMatchObject({
      tenantId,
      email: 'owner@example.com',
      role: MEMBERSHIP_ROLE.OWNER,
      consumedAt: null,
    });
  });

  it('is idempotent for a duplicate pending invite to the same tenant + email', async () => {
    const { id: tenantId } = await insertTestTenant(db);
    const first = await createMembershipInvite(
      tenantId,
      'owner@example.com',
      MEMBERSHIP_ROLE.OWNER,
    );

    const second = await createMembershipInvite(
      tenantId,
      'owner@example.com',
      MEMBERSHIP_ROLE.EDITOR,
    );

    expect(second.outcome).toBe('already-pending');
    // Not escalated to EDITOR — a duplicate call leaves the existing
    // invite's role untouched.
    expect(second.invite).toEqual(first.invite);
    const rows = await db.select().from(schema.membershipInvites);
    expect(rows).toHaveLength(1);
  });

  it('is idempotent (case-insensitively) for a duplicate invite with different casing', async () => {
    const { id: tenantId } = await insertTestTenant(db);
    await createMembershipInvite(
      tenantId,
      'owner@example.com',
      MEMBERSHIP_ROLE.OWNER,
    );

    const result = await createMembershipInvite(
      tenantId,
      'OWNER@EXAMPLE.COM',
      MEMBERSHIP_ROLE.OWNER,
    );

    expect(result.outcome).toBe('already-pending');
    const rows = await db.select().from(schema.membershipInvites);
    expect(rows).toHaveLength(1);
  });

  it('is idempotent (trimming whitespace) for a duplicate invite padded with leading/trailing spaces', async () => {
    const { id: tenantId } = await insertTestTenant(db);
    await createMembershipInvite(
      tenantId,
      'owner@example.com',
      MEMBERSHIP_ROLE.OWNER,
    );

    const result = await createMembershipInvite(
      tenantId,
      '  owner@example.com  ',
      MEMBERSHIP_ROLE.OWNER,
    );

    expect(result.outcome).toBe('already-pending');
    const rows = await db.select().from(schema.membershipInvites);
    expect(rows).toHaveLength(1);
  });

  it('reports already-consumed for a duplicate invite whose original was already consumed', async () => {
    const { id: tenantId } = await insertTestTenant(db);
    const first = await createMembershipInvite(
      tenantId,
      'owner@example.com',
      MEMBERSHIP_ROLE.OWNER,
    );
    await db
      .update(schema.membershipInvites)
      .set({ consumedAt: new Date() })
      .where(eq(schema.membershipInvites.id, first.invite.id));

    const second = await createMembershipInvite(
      tenantId,
      'owner@example.com',
      MEMBERSHIP_ROLE.OWNER,
    );

    expect(second.outcome).toBe('already-consumed');
  });

  it('allows the same email to hold a distinct pending invite on a different tenant', async () => {
    const { id: tenantOneId } = await insertTestTenant(db);
    const { id: tenantTwoId } = await insertTestTenant(db);

    await createMembershipInvite(
      tenantOneId,
      'owner@example.com',
      MEMBERSHIP_ROLE.OWNER,
    );
    await createMembershipInvite(
      tenantTwoId,
      'owner@example.com',
      MEMBERSHIP_ROLE.READER,
    );

    const rows = await db.select().from(schema.membershipInvites);
    expect(rows).toHaveLength(2);
  });

  it('rejects an invite for a tenant that does not exist', async () => {
    await expect(
      createMembershipInvite(
        '00000000-0000-0000-0000-000000000000',
        'owner@example.com',
        MEMBERSHIP_ROLE.OWNER,
      ),
    ).rejects.toThrow();
  });
});
