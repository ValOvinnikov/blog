import {
  MEMBERSHIP_ROLE,
  TENANT_PLAN,
  TENANT_STATUS,
} from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { createTestDb } from '@blog/db/testing/create-test-db';
import { eq } from 'drizzle-orm';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

import { createMembershipInvite } from './create-membership-invite';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

let db: PgliteDatabase<typeof schema>;

async function insertTenant(slug: string): Promise<string> {
  const [tenant] = await db
    .insert(schema.tenants)
    .values({
      slug,
      name: slug,
      primaryDomain: `${slug}.example.com`,
      locale: 'en',
      plan: TENANT_PLAN.FREE,
      status: TENANT_STATUS.ACTIVE,
    })
    .returning();
  return tenant!.id;
}

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
    const tenantId = await insertTenant('acme');

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
    const tenantId = await insertTenant('acme');
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
    const tenantId = await insertTenant('acme');
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

  it('reports already-consumed for a duplicate invite whose original was already consumed', async () => {
    const tenantId = await insertTenant('acme');
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
    const tenantOneId = await insertTenant('acme');
    const tenantTwoId = await insertTenant('other');

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
