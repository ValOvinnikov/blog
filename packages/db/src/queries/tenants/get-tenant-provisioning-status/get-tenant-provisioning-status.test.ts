import { TENANT_PLAN, TENANT_STATUS } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import type { TTenantProvisioningState } from '@blog/db/schema/tenants';
import { createTestDb } from '@blog/db/testing/create-test-db';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

import { getTenantProvisioningStatus } from './get-tenant-provisioning-status';

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
  await db.delete(schema.tenants);
});

describe(getTenantProvisioningStatus, () => {
  it('returns the overall status and per-step map for an existing tenant', async () => {
    const provisioningSteps: TTenantProvisioningState = {
      SANITY_PROJECT: { status: 'DONE' },
      SEED_CONTENT: { status: 'RUNNING' },
      PERSIST_TOKEN: { status: 'IDLE' },
      MAP_DOMAIN: { status: 'IDLE' },
      CREATE_WEBHOOK: { status: 'IDLE' },
      OWNER_ELEVATION: { status: 'IDLE' },
    };
    const [tenant] = await db
      .insert(schema.tenants)
      .values({
        name: 'Acme',
        primaryDomain: 'acme.example.com',
        locale: 'en',
        plan: TENANT_PLAN.FREE,
        status: TENANT_STATUS.ACTIVE,
        provisioningStatus: 'PROVISIONING',
        provisioningSteps,
      })
      .returning();

    if (!tenant) throw new Error('setup: tenant insert returned no row.');

    const result = await getTenantProvisioningStatus(tenant.id);

    expect(result).toEqual({
      provisioningStatus: 'PROVISIONING',
      provisioningSteps,
    });
  });

  it('returns undefined for a tenant id that does not exist', async () => {
    const result = await getTenantProvisioningStatus(
      '00000000-0000-0000-0000-000000000000',
    );

    expect(result).toBeUndefined();
  });

  it('returns null fields for a tenant that predates provisioning tracking', async () => {
    const [tenant] = await db
      .insert(schema.tenants)
      .values({
        name: 'Legacy',
        primaryDomain: 'legacy.example.com',
        locale: 'en',
        plan: TENANT_PLAN.FREE,
        status: TENANT_STATUS.ACTIVE,
      })
      .returning();

    if (!tenant) throw new Error('setup: tenant insert returned no row.');

    const result = await getTenantProvisioningStatus(tenant.id);

    expect(result).toEqual({
      provisioningStatus: null,
      provisioningSteps: null,
    });
  });
});
