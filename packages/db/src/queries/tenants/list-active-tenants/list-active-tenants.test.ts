import { TENANT_STATUS } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { MOCK_DEPROVISIONED_AT } from '@blog/db/testing/tenants/fixtures';

import { listActiveTenants } from './list-active-tenants';

vi.mock('@blog/db/client');

const db = useQueryTestDb();

afterEach(async () => {
  await db().delete(schema.tenants);
});

describe(listActiveTenants, () => {
  it('includes an ACTIVE, non-deprovisioned tenant', async () => {
    const tenant = await insertTestTenant(db());

    const result = await listActiveTenants();

    expect(result).toEqual([tenant]);
  });

  it.each([
    ['a SUSPENDED tenant', { status: TENANT_STATUS.SUSPENDED }],
    ['an ARCHIVED tenant', { status: TENANT_STATUS.ARCHIVED }],
    [
      'a deprovisioned tenant whose status still reads ACTIVE',
      { status: TENANT_STATUS.ACTIVE, deprovisionedAt: MOCK_DEPROVISIONED_AT },
    ],
  ])('excludes %s', async (_description, overrides) => {
    await insertTestTenant(db(), overrides);

    const result = await listActiveTenants();

    expect(result).toEqual([]);
  });

  it('returns an empty array when no tenants exist', async () => {
    const result = await listActiveTenants();

    expect(result).toEqual([]);
  });
});
