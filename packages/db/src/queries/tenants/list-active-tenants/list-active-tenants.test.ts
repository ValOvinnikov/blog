import { TENANT_STATUS } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { MOCK_TENANT_VALUES } from '@blog/db/testing/tenants/fixtures';

import { listActiveTenants } from './list-active-tenants';

vi.mock('@blog/db/client');

const db = useQueryTestDb();

async function insertTenant(
  overrides: Parameters<typeof insertTestTenant>[1] = {},
) {
  await insertTestTenant(db(), {
    ...MOCK_TENANT_VALUES,
    status: TENANT_STATUS.ACTIVE,
    ...overrides,
  });
}

afterEach(async () => {
  await db().delete(schema.tenants);
});

describe(listActiveTenants, () => {
  it('includes an ACTIVE, non-deprovisioned tenant', async () => {
    await insertTenant();

    const result = await listActiveTenants();

    expect(result.map((tenant) => tenant.name)).toEqual([
      MOCK_TENANT_VALUES.name,
    ]);
  });

  it.each([
    ['a SUSPENDED tenant', { status: TENANT_STATUS.SUSPENDED }],
    ['an ARCHIVED tenant', { status: TENANT_STATUS.ARCHIVED }],
    [
      'a deprovisioned tenant whose status still reads ACTIVE',
      { status: TENANT_STATUS.ACTIVE, deprovisionedAt: new Date() },
    ],
  ])('excludes %s', async (_description, overrides) => {
    await insertTenant(overrides);

    const result = await listActiveTenants();

    expect(result).toEqual([]);
  });

  it('returns an empty array when no tenants exist', async () => {
    const result = await listActiveTenants();

    expect(result).toEqual([]);
  });
});
