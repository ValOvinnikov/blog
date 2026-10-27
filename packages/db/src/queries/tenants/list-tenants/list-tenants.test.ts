import { TENANT_STATUS } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import type { TTenant } from '@blog/db/schema/tenants';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { MOCK_DEPROVISIONED_AT } from '@blog/db/testing/tenants/fixtures';
import { faker } from '@faker-js/faker';

import { listTenants } from './list-tenants';

vi.mock('@blog/db/client');

faker.seed(6020);

const db = useQueryTestDb();

const MOCK_FIRST_NAME = `A ${faker.company.name()}`;
const MOCK_LAST_NAME = `Z ${faker.company.name()}`;

afterEach(async () => {
  await db().delete(schema.tenants);
});

describe(listTenants, () => {
  describe('with an active and a deprovisioned tenant', () => {
    let activeTenant: TTenant;
    let archivedTenant: TTenant;

    beforeEach(async () => {
      activeTenant = await insertTestTenant(db(), { name: MOCK_FIRST_NAME });
      archivedTenant = await insertTestTenant(db(), {
        name: MOCK_LAST_NAME,
        status: TENANT_STATUS.ARCHIVED,
        deprovisionedAt: MOCK_DEPROVISIONED_AT,
      });
    });

    it('excludes deprovisioned tenants by default', async () => {
      const result = await listTenants();

      expect(result).toEqual([activeTenant]);
    });

    it('includes deprovisioned tenants when includeArchived is true', async () => {
      const result = await listTenants({ includeArchived: true });

      expect(result).toEqual([activeTenant, archivedTenant]);
    });
  });

  it('returns every tenant ordered by name', async () => {
    const lastTenant = await insertTestTenant(db(), { name: MOCK_LAST_NAME });
    const firstTenant = await insertTestTenant(db(), { name: MOCK_FIRST_NAME });

    const result = await listTenants();

    expect(result).toEqual([firstTenant, lastTenant]);
  });

  it('returns an empty array when no tenants exist', async () => {
    const result = await listTenants();

    expect(result).toEqual([]);
  });
});
