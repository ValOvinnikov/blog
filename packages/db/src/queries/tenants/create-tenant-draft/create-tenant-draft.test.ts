import { ERROR_CODE } from '@blog/config/constants';
import { TENANT_PLAN, TENANT_STATUS } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { createTestDb } from '@blog/db/testing/create-test-db';
import { insertTestUser } from '@blog/db/testing/fixtures';
import { eq } from 'drizzle-orm';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

import {
  createTenantDraft,
  type TCreateTenantDraftInput,
} from './create-tenant-draft';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

let db: PgliteDatabase<typeof schema>;

const draftInput: TCreateTenantDraftInput = {
  name: 'Acme',
  domain: 'acme.example.com',
  locale: 'en',
  plan: TENANT_PLAN.FREE,
  owner: { type: 'user', userId: 'user-1' },
};

beforeAll(async () => {
  db = await createTestDb();
}, 30_000);

beforeEach(() => {
  getDbMock.mockReturnValue(db);
});

afterEach(async () => {
  await db.delete(schema.memberships);
  await db.delete(schema.membershipInvites);
  await db.delete(schema.tenantDomains);
  await db.delete(schema.tenants);
  await db.delete(schema.users);
});

describe(createTenantDraft, () => {
  it('inserts a tenant row left in PENDING with an idle per-step map and no Sanity project yet', async () => {
    await insertTestUser(db, { id: 'user-1' });

    const result = await createTenantDraft(draftInput);

    if (!result.ok) throw new Error('expected ok:true');
    expect(result.data).toMatchObject({
      name: 'Acme',
      primaryDomain: 'acme.example.com',
      locale: 'en',
      plan: TENANT_PLAN.FREE,
      status: TENANT_STATUS.ACTIVE,
      provisioningStatus: 'PENDING',
      sanityProjectId: null,
      sanityDataset: null,
    });
    expect(result.data.provisioningSteps).toEqual({
      SANITY_PROJECT: { status: 'IDLE' },
      SEED_CONTENT: { status: 'IDLE' },
      PERSIST_TOKEN: { status: 'IDLE' },
      MAP_DOMAIN: { status: 'IDLE' },
      CREATE_WEBHOOK: { status: 'IDLE' },
      OWNER_ELEVATION: { status: 'IDLE' },
    });
  });

  it('inserts the primary domain into tenant_domains', async () => {
    await insertTestUser(db, { id: 'user-1' });

    const result = await createTenantDraft(draftInput);

    if (!result.ok) throw new Error('expected ok:true');
    const [domainRow] = await db
      .select()
      .from(schema.tenantDomains)
      .where(eq(schema.tenantDomains.tenantId, result.data.id));

    expect(domainRow).toMatchObject({
      tenantId: result.data.id,
      domain: 'acme.example.com',
    });
  });

  it('inserts an OWNER membership row for the given owner user id', async () => {
    await insertTestUser(db, { id: 'user-1' });

    const result = await createTenantDraft(draftInput);

    if (!result.ok) throw new Error('expected ok:true');
    const [membershipRow] = await db
      .select()
      .from(schema.memberships)
      .where(eq(schema.memberships.tenantId, result.data.id));

    expect(membershipRow).toMatchObject({
      tenantId: result.data.id,
      userId: 'user-1',
      role: 'OWNER',
    });
  });

  it('inserts a pending OWNER membershipInvites row instead of a membership when the owner has no resolved user yet', async () => {
    const result = await createTenantDraft({
      ...draftInput,
      owner: { type: 'invite', email: 'Owner@Example.com' },
    });

    if (!result.ok) throw new Error('expected ok:true');

    const [inviteRow] = await db
      .select()
      .from(schema.membershipInvites)
      .where(eq(schema.membershipInvites.tenantId, result.data.id));

    expect(inviteRow).toMatchObject({
      tenantId: result.data.id,
      email: 'owner@example.com',
      role: 'OWNER',
      consumedAt: null,
    });

    const membershipRows = await db
      .select()
      .from(schema.memberships)
      .where(eq(schema.memberships.tenantId, result.data.id));
    expect(membershipRows).toHaveLength(0);
  });

  it('rejects when the owner user id does not exist, and leaves no orphaned tenant or domain row behind', async () => {
    await expect(createTenantDraft(draftInput)).rejects.toThrow();

    const tenantRows = await db.select().from(schema.tenants);
    expect(tenantRows).toHaveLength(0);

    const domainRows = await db
      .select()
      .from(schema.tenantDomains)
      .where(eq(schema.tenantDomains.domain, draftInput.domain));
    expect(domainRows).toHaveLength(0);
  });

  it('rejects on a colliding domain and leaves the second tenant and its dependents cleaned up', async () => {
    await insertTestUser(db, { id: 'user-1' });
    await insertTestUser(db, { id: 'user-2' });
    await createTenantDraft(draftInput);

    await expect(
      createTenantDraft({
        ...draftInput,
        owner: { type: 'user', userId: 'user-2' },
      }),
    ).rejects.toThrow();

    const tenantRows = await db.select().from(schema.tenants);
    expect(tenantRows).toHaveLength(1);

    const secondMembershipRows = await db
      .select()
      .from(schema.memberships)
      .where(eq(schema.memberships.userId, 'user-2'));
    expect(secondMembershipRows).toHaveLength(0);

    // The first tenant's own domain row is untouched by the second call's
    // failure and cleanup.
    const domainRows = await db
      .select()
      .from(schema.tenantDomains)
      .where(eq(schema.tenantDomains.domain, draftInput.domain));
    expect(domainRows).toHaveLength(1);
  });

  it('rejects on a colliding domain for an invite-email owner, and leaves the second tenant and its invite cleaned up', async () => {
    await createTenantDraft({
      ...draftInput,
      owner: { type: 'invite', email: 'owner@example.com' },
    });

    await expect(
      createTenantDraft({
        ...draftInput,
        owner: { type: 'invite', email: 'owner-2@example.com' },
      }),
    ).rejects.toThrow();

    const tenantRows = await db.select().from(schema.tenants);
    expect(tenantRows).toHaveLength(1);

    const secondInviteRows = await db
      .select()
      .from(schema.membershipInvites)
      .where(eq(schema.membershipInvites.email, 'owner-2@example.com'));
    expect(secondInviteRows).toHaveLength(0);
  });

  it.each([
    ['a scheme-prefixed value', 'https://acme.com'],
    ['a trailing-slash value', 'acme.com/'],
    ['a whitespace-padded value', ' acme.com '],
  ])(
    'rejects %s for domain without writing any row',
    async (_description, domain) => {
      await insertTestUser(db, { id: 'user-1' });

      const result = await createTenantDraft({ ...draftInput, domain });

      expect(result).toEqual({
        ok: false,
        error: ERROR_CODE.DB_INVALID_DOMAIN,
      });

      const tenantRows = await db.select().from(schema.tenants);
      expect(tenantRows).toHaveLength(0);

      const domainRows = await db.select().from(schema.tenantDomains);
      expect(domainRows).toHaveLength(0);

      const membershipRows = await db.select().from(schema.memberships);
      expect(membershipRows).toHaveLength(0);
    },
  );
});
