import { ERROR_CODE } from '@blog/config/constants';
import {
  TENANT_PLAN,
  TENANT_PROVISIONING_STATUS,
  TENANT_STATUS,
} from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { tenants } from '@blog/db/schema/tenants';
import { createTestDb } from '@blog/db/testing/create-test-db';
import { eq } from 'drizzle-orm';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

import { setTenantProvisioningStatus } from './set-tenant-provisioning-status';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

let db: PgliteDatabase<typeof schema>;

async function insertTenant(overrides?: {
  provisioningStatus?: (typeof TENANT_PROVISIONING_STATUS)[keyof typeof TENANT_PROVISIONING_STATUS];
}): Promise<string> {
  const [tenant] = await db
    .insert(schema.tenants)
    .values({
      slug: 'acme',
      name: 'Acme',
      primaryDomain: 'acme.example.com',
      locale: 'en',
      plan: TENANT_PLAN.FREE,
      status: TENANT_STATUS.ACTIVE,
      provisioningStatus: overrides?.provisioningStatus,
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

describe(setTenantProvisioningStatus, () => {
  it('reverts a PROVISIONING tenant back to its prior status', async () => {
    const tenantId = await insertTenant({
      provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
    });

    const result = await setTenantProvisioningStatus(
      tenantId,
      TENANT_PROVISIONING_STATUS.PENDING,
    );

    if (!result.ok) throw new Error('expected ok:true');
    expect(result.data.provisioningStatus).toBe(
      TENANT_PROVISIONING_STATUS.PENDING,
    );
  });

  it('reverts a PROVISIONING tenant back to NULL when there was no prior status', async () => {
    const tenantId = await insertTenant({
      provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
    });

    const result = await setTenantProvisioningStatus(tenantId, null);

    if (!result.ok) throw new Error('expected ok:true');
    expect(result.data.provisioningStatus).toBeNull();
  });

  it('leaves every other column untouched', async () => {
    const tenantId = await insertTenant({
      provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
    });

    await setTenantProvisioningStatus(
      tenantId,
      TENANT_PROVISIONING_STATUS.FAILED,
    );

    const [row] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId));

    expect(row).toMatchObject({ slug: 'acme', name: 'Acme' });
  });

  it('returns DB_NOT_FOUND for a tenant id that does not exist', async () => {
    const result = await setTenantProvisioningStatus(
      '00000000-0000-0000-0000-000000000000',
      TENANT_PROVISIONING_STATUS.PENDING,
    );

    expect(result).toEqual({ ok: false, error: ERROR_CODE.DB_NOT_FOUND });
  });
});
