import { TENANT_PROVISIONING_STATUS, TENANT_STATUS } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { MOCK_DEPROVISIONED_AT } from '@blog/db/testing/tenants/fixtures';

import { listTenantsPendingOwnerElevation } from './list-tenants-pending-owner-elevation';

vi.mock('@blog/db/client');

const db = useQueryTestDb();

afterEach(async () => {
  await db().delete(schema.tenants);
});

describe(listTenantsPendingOwnerElevation, () => {
  it('includes an ACTIVE, READY tenant', async () => {
    const tenant = await insertTestTenant(db(), {
      provisioningStatus: TENANT_PROVISIONING_STATUS.READY,
    });

    const result = await listTenantsPendingOwnerElevation();

    expect(result).toEqual([tenant]);
  });

  it.each([
    [
      'a tenant whose provisioning is PENDING',
      { provisioningStatus: TENANT_PROVISIONING_STATUS.PENDING },
    ],
    [
      'a tenant whose provisioning is PROVISIONING',
      { provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING },
    ],
    [
      'a tenant whose provisioning is FAILED',
      { provisioningStatus: TENANT_PROVISIONING_STATUS.FAILED },
    ],
    ['a SUSPENDED tenant', { status: TENANT_STATUS.SUSPENDED }],
    [
      'a deprovisioned, ARCHIVED tenant',
      {
        status: TENANT_STATUS.ARCHIVED,
        deprovisionedAt: MOCK_DEPROVISIONED_AT,
      },
    ],
  ])('excludes %s', async (_description, overrides) => {
    await insertTestTenant(db(), {
      provisioningStatus: TENANT_PROVISIONING_STATUS.READY,
      ...overrides,
    });

    const result = await listTenantsPendingOwnerElevation();

    expect(result).toEqual([]);
  });

  it('returns an empty array when no tenants exist', async () => {
    const result = await listTenantsPendingOwnerElevation();

    expect(result).toEqual([]);
  });
});
