import { TENANT_PLAN, TENANT_STATUS } from '@blog/config/constants';
import * as schema from '@blog/db/schema';
import { createTestDb } from '@blog/db/testing/create-test-db';
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
  slug: 'acme',
  domain: 'acme.example.com',
  locale: 'en',
  plan: TENANT_PLAN.FREE,
  ownerUserId: 'user-1',
};

async function insertUser(id: string): Promise<void> {
  await db.insert(schema.users).values({ id });
}

beforeAll(async () => {
  db = await createTestDb();
}, 30_000);

beforeEach(() => {
  getDbMock.mockReturnValue(db);
});

afterEach(async () => {
  await db.delete(schema.memberships);
  await db.delete(schema.tenantDomains);
  await db.delete(schema.tenants);
  await db.delete(schema.users);
});

describe(createTenantDraft, () => {
  it('inserts a tenant row left in PENDING with an idle per-step map and no Sanity project yet', async () => {
    await insertUser('user-1');

    const tenant = await createTenantDraft(draftInput);

    expect(tenant).toMatchObject({
      slug: 'acme',
      name: 'Acme',
      primaryDomain: 'acme.example.com',
      locale: 'en',
      plan: TENANT_PLAN.FREE,
      status: TENANT_STATUS.ACTIVE,
      provisioningStatus: 'PENDING',
      sanityProjectId: null,
      sanityDataset: null,
    });
    expect(tenant.provisioningSteps).toEqual({
      SANITY_PROJECT: { status: 'IDLE' },
      SEED_CONTENT: { status: 'IDLE' },
      DEPLOY_STUDIO: { status: 'IDLE' },
      PERSIST_TOKEN: { status: 'IDLE' },
      MAP_DOMAIN: { status: 'IDLE' },
    });
  });

  it('inserts the primary domain into tenant_domains', async () => {
    await insertUser('user-1');

    const tenant = await createTenantDraft(draftInput);

    const [domainRow] = await db
      .select()
      .from(schema.tenantDomains)
      .where(eq(schema.tenantDomains.tenantId, tenant.id));

    expect(domainRow).toMatchObject({
      tenantId: tenant.id,
      domain: 'acme.example.com',
    });
  });

  it('inserts an OWNER membership row for the given owner user id', async () => {
    await insertUser('user-1');

    const tenant = await createTenantDraft(draftInput);

    const [membershipRow] = await db
      .select()
      .from(schema.memberships)
      .where(eq(schema.memberships.tenantId, tenant.id));

    expect(membershipRow).toMatchObject({
      tenantId: tenant.id,
      userId: 'user-1',
      role: 'OWNER',
    });
  });

  it('rejects when the owner user id does not exist, and leaves no orphaned tenant or domain row behind', async () => {
    await expect(createTenantDraft(draftInput)).rejects.toThrow();

    const tenantRows = await db
      .select()
      .from(schema.tenants)
      .where(eq(schema.tenants.slug, draftInput.slug));
    expect(tenantRows).toHaveLength(0);

    const domainRows = await db
      .select()
      .from(schema.tenantDomains)
      .where(eq(schema.tenantDomains.domain, draftInput.domain));
    expect(domainRows).toHaveLength(0);
  });

  it('rejects on a colliding domain and leaves the second tenant and its dependents cleaned up', async () => {
    await insertUser('user-1');
    await insertUser('user-2');
    await createTenantDraft(draftInput);

    await expect(
      createTenantDraft({
        ...draftInput,
        slug: 'acme-2',
        ownerUserId: 'user-2',
      }),
    ).rejects.toThrow();

    const secondTenantRows = await db
      .select()
      .from(schema.tenants)
      .where(eq(schema.tenants.slug, 'acme-2'));
    expect(secondTenantRows).toHaveLength(0);

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
});
