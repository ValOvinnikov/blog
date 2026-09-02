import {
  TENANT_PLAN,
  TENANT_PROVISIONING_STATUS,
  TENANT_PROVISIONING_STEP,
  TENANT_PROVISIONING_STEP_STATUS,
  TENANT_STATUS,
} from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { tenants } from '@blog/db/schema/tenants';
import { createTestDb } from '@blog/db/testing/create-test-db';
import { eq } from 'drizzle-orm';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

import { clearTenantProvisioningArtifacts } from './clear-tenant-provisioning-artifacts';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

let db: PgliteDatabase<typeof schema>;

async function insertProvisionedTenant(): Promise<string> {
  const [tenant] = await db
    .insert(schema.tenants)
    .values({
      slug: 'acme',
      name: 'Acme',
      primaryDomain: 'acme.example.com',
      sanityProjectId: 'proj123',
      sanityDataset: 'production',
      sanityReadTokenEncrypted: 'encrypted-token',
      sanityWriteTokenEncrypted: 'encrypted-write-token',
      locale: 'en',
      plan: TENANT_PLAN.FREE,
      status: TENANT_STATUS.ACTIVE,
      provisioningStatus: TENANT_PROVISIONING_STATUS.READY,
      provisioningSteps: {
        [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: {
          status: TENANT_PROVISIONING_STEP_STATUS.DONE,
        },
        [TENANT_PROVISIONING_STEP.SEED_CONTENT]: {
          status: TENANT_PROVISIONING_STEP_STATUS.DONE,
        },
        [TENANT_PROVISIONING_STEP.PERSIST_TOKEN]: {
          status: TENANT_PROVISIONING_STEP_STATUS.DONE,
        },
        [TENANT_PROVISIONING_STEP.MAP_DOMAIN]: {
          status: TENANT_PROVISIONING_STEP_STATUS.DONE,
        },
        [TENANT_PROVISIONING_STEP.CREATE_WEBHOOK]: {
          status: TENANT_PROVISIONING_STEP_STATUS.DONE,
        },
        [TENANT_PROVISIONING_STEP.OWNER_ELEVATION]: {
          status: TENANT_PROVISIONING_STEP_STATUS.IDLE,
        },
      },
      studioVercelProjectId: 'prj_studio',
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

describe(clearTenantProvisioningArtifacts, () => {
  it('nulls every provisioning column except sanityProjectId/sanityDataset — the archived project still exists', async () => {
    const tenantId = await insertProvisionedTenant();

    await clearTenantProvisioningArtifacts(tenantId);

    const [row] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId));

    expect(row).toMatchObject({
      sanityProjectId: 'proj123',
      sanityDataset: 'production',
      sanityReadTokenEncrypted: null,
      sanityWriteTokenEncrypted: null,
      studioVercelProjectId: null,
      provisioningStatus: null,
      provisioningSteps: null,
    });
  });

  it('leaves identity columns untouched', async () => {
    const tenantId = await insertProvisionedTenant();

    await clearTenantProvisioningArtifacts(tenantId);

    const [row] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId));

    expect(row).toMatchObject({
      slug: 'acme',
      name: 'Acme',
      primaryDomain: 'acme.example.com',
    });
  });

  it('is safe to call again once already cleared', async () => {
    const tenantId = await insertProvisionedTenant();

    await clearTenantProvisioningArtifacts(tenantId);
    await expect(
      clearTenantProvisioningArtifacts(tenantId),
    ).resolves.toBeUndefined();
  });
});
