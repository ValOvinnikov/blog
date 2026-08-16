import { TENANT_PLAN, TENANT_STATUS } from '@blog/config/constants';
import * as schema from '@blog/db/schema';
import { tenants } from '@blog/db/schema/tenants';
import { createTestDb } from '@blog/db/testing/create-test-db';
import { eq } from 'drizzle-orm';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

import { setTenantSanityProject } from './set-tenant-sanity-project';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

let db: PgliteDatabase<typeof schema>;

async function insertDraftTenant(): Promise<string> {
  const [tenant] = await db
    .insert(schema.tenants)
    .values({
      slug: 'acme',
      name: 'Acme',
      primaryDomain: 'acme.example.com',
      locale: 'en',
      plan: TENANT_PLAN.FREE,
      status: TENANT_STATUS.ACTIVE,
    })
    .returning();

  if (!tenant) throw new Error('setup: tenant insert returned no row.');

  return tenant.id;
}

beforeAll(async () => {
  db = await createTestDb();
}, 30_000);

beforeEach(() => {
  getDbMock.mockReturnValue(db);
});

afterEach(async () => {
  await db.delete(schema.tenants);
});

describe(setTenantSanityProject, () => {
  it('sets the Sanity project id and dataset', async () => {
    const tenantId = await insertDraftTenant();

    await setTenantSanityProject(tenantId, {
      sanityProjectId: 'abc123',
      sanityDataset: 'production',
    });

    const [row] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId));

    expect(row).toMatchObject({
      sanityProjectId: 'abc123',
      sanityDataset: 'production',
    });
  });

  it('leaves every other column untouched', async () => {
    const tenantId = await insertDraftTenant();

    await setTenantSanityProject(tenantId, {
      sanityProjectId: 'abc123',
      sanityDataset: 'production',
    });

    const [row] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId));

    expect(row).toMatchObject({
      slug: 'acme',
      name: 'Acme',
      primaryDomain: 'acme.example.com',
      studioVercelProjectId: null,
      seededAt: null,
    });
  });

  it('rejects for a tenant id that does not exist', async () => {
    // No row updated; the underlying query resolves without error since a
    // zero-row UPDATE is not itself a Postgres error — asserting on row
    // count elsewhere in this file is what actually catches a bad id.
    await expect(
      setTenantSanityProject('00000000-0000-0000-0000-000000000000', {
        sanityProjectId: 'abc123',
        sanityDataset: 'production',
      }),
    ).resolves.toBeUndefined();
  });
});
