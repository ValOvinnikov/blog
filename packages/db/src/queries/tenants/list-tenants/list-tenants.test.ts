import { SORT_DIRECTION, TENANT_SORT_COLUMN } from '@blog/config/constants';
import { TENANT_PLAN, TENANT_STATUS } from '@blog/db/constants';
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
const MOCK_NEWER_CREATED_AT = faker.date.recent();
const MOCK_OLDER_CREATED_AT = faker.date.past({
  refDate: MOCK_NEWER_CREATED_AT,
});
const MOCK_SEARCH_WORD = faker.string.alpha({ length: 8, casing: 'lower' });
const MOCK_SLUG = faker.string.alpha({ length: 10, casing: 'lower' });
const MOCK_CUSTOM_PRIMARY_DOMAIN = faker.internet.domainName();

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

  describe('with an older and a newer tenant', () => {
    let olderTenant: TTenant;
    let newerTenant: TTenant;

    beforeEach(async () => {
      olderTenant = await insertTestTenant(db(), {
        name: MOCK_FIRST_NAME,
        plan: TENANT_PLAN.GROWTH,
        createdAt: MOCK_OLDER_CREATED_AT,
      });
      newerTenant = await insertTestTenant(db(), {
        name: MOCK_LAST_NAME,
        plan: TENANT_PLAN.FREE,
        createdAt: MOCK_NEWER_CREATED_AT,
      });
    });

    it('orders newest first when sorted by created date descending', async () => {
      const result = await listTenants({
        sort: {
          column: TENANT_SORT_COLUMN.CREATED,
          direction: SORT_DIRECTION.DESCENDING,
        },
      });

      expect(result).toEqual([newerTenant, olderTenant]);
    });

    it('orders by plan when sorted by plan ascending', async () => {
      const result = await listTenants({
        sort: {
          column: TENANT_SORT_COLUMN.PLAN,
          direction: SORT_DIRECTION.ASCENDING,
        },
      });

      expect(result).toEqual([newerTenant, olderTenant]);
    });

    it('reverses the name order when sorted by name descending', async () => {
      const result = await listTenants({
        sort: {
          column: TENANT_SORT_COLUMN.NAME,
          direction: SORT_DIRECTION.DESCENDING,
        },
      });

      expect(result).toEqual([newerTenant, olderTenant]);
    });
  });

  describe('with a search', () => {
    let matchingTenant: TTenant;

    beforeEach(async () => {
      matchingTenant = await insertTestTenant(db(), {
        name: `${MOCK_FIRST_NAME} ${MOCK_SEARCH_WORD}`,
      });
      await insertTestTenant(db(), { name: MOCK_LAST_NAME });
    });

    it('narrows to tenants whose name contains it, ignoring case', async () => {
      const result = await listTenants({
        search: MOCK_SEARCH_WORD.toUpperCase(),
      });

      expect(result).toEqual([matchingTenant]);
    });

    it('matches against the primary domain', async () => {
      const domainTenant = await insertTestTenant(db(), {
        name: MOCK_LAST_NAME,
        primaryDomain: `${MOCK_SEARCH_WORD}-site.example.com`,
      });

      const result = await listTenants({ search: `${MOCK_SEARCH_WORD}-site` });

      expect(result).toEqual([domainTenant]);
    });

    it('matches against any of the tenant domains', async () => {
      const customDomainTenant = await insertTestTenant(db(), {
        name: MOCK_LAST_NAME,
        primaryDomain: MOCK_CUSTOM_PRIMARY_DOMAIN,
      });
      await db()
        .insert(schema.tenantDomains)
        .values([
          {
            tenantId: customDomainTenant.id,
            domain: MOCK_CUSTOM_PRIMARY_DOMAIN,
          },
          {
            tenantId: customDomainTenant.id,
            domain: `${MOCK_SLUG}.example.com`,
          },
        ]);

      const result = await listTenants({ search: MOCK_SLUG });

      expect(result).toEqual([customDomainTenant]);
    });

    it('treats wildcard characters as literal text', async () => {
      const result = await listTenants({ search: '%' });

      expect(result).toEqual([]);
    });
  });

  it('returns an empty array when no tenants exist', async () => {
    const result = await listTenants();

    expect(result).toEqual([]);
  });
});
