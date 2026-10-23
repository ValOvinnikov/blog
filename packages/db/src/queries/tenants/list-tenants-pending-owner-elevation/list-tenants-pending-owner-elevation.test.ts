import { TENANT_PROVISIONING_STATUS, TENANT_STATUS } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { MOCK_TENANT_VALUES } from '@blog/db/testing/tenants/fixtures';

import { listTenantsPendingOwnerElevation } from './list-tenants-pending-owner-elevation';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);

async function insertTenant(
  overrides: Parameters<typeof insertTestTenant>[1] = {},
) {
  await insertTestTenant(db(), {
    ...MOCK_TENANT_VALUES,
    status: TENANT_STATUS.ACTIVE,
    provisioningStatus: TENANT_PROVISIONING_STATUS.READY,
    ...overrides,
  });
}

afterEach(async () => {
  await db().delete(schema.tenants);
});

describe(listTenantsPendingOwnerElevation, () => {
  it('includes an ACTIVE, READY tenant', async () => {
    await insertTenant();

    const result = await listTenantsPendingOwnerElevation();

    expect(result.map((tenant) => tenant.name)).toEqual([
      MOCK_TENANT_VALUES.name,
    ]);
  });

  it.each([
    TENANT_PROVISIONING_STATUS.PENDING,
    TENANT_PROVISIONING_STATUS.PROVISIONING,
    TENANT_PROVISIONING_STATUS.FAILED,
  ])('excludes a tenant with provisioningStatus %s', async (status) => {
    await insertTenant({ provisioningStatus: status });

    const result = await listTenantsPendingOwnerElevation();

    expect(result).toEqual([]);
  });

  it.each([
    ['a SUSPENDED tenant', { status: TENANT_STATUS.SUSPENDED }],
    [
      'a deprovisioned, ARCHIVED tenant',
      { status: TENANT_STATUS.ARCHIVED, deprovisionedAt: new Date() },
    ],
  ])('excludes %s', async (_description, overrides) => {
    await insertTenant(overrides);

    const result = await listTenantsPendingOwnerElevation();

    expect(result).toEqual([]);
  });

  it('returns an empty array when no tenants exist', async () => {
    const result = await listTenantsPendingOwnerElevation();

    expect(result).toEqual([]);
  });
});
