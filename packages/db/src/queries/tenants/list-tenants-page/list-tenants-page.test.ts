import { faker } from '@faker-js/faker';
import {
  SORT_DIRECTION,
  TENANT_PLAN,
  TENANT_SORT_COLUMN,
} from '@shinefold/config/constants';
import { TENANT_STATUS } from '@shinefold/db/constants';
import * as schema from '@shinefold/db/schema';
import type { TTenant } from '@shinefold/db/schema/tenants';
import { insertTestTenant } from '@shinefold/db/testing/fixtures';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';
import { insertTestTenantDomain } from '@shinefold/db/testing/tenant-domains/fixtures';
import { MOCK_DEPROVISIONED_AT } from '@shinefold/db/testing/tenants/fixtures';

import { listTenantsPage, type TTenantsPageRow } from './list-tenants-page';

vi.mock('@shinefold/db/client');

faker.seed(8076);

const MOCK_PAGE_SIZE = 2;
const MOCK_FIRST_NAME = `A ${faker.company.name()}`;
const MOCK_MIDDLE_NAME = `M ${faker.company.name()}`;
const MOCK_LAST_NAME = `Z ${faker.company.name()}`;
const MOCK_NEWER_CREATED_AT = faker.date.recent();
const MOCK_OLDER_CREATED_AT = faker.date.past({
  refDate: MOCK_NEWER_CREATED_AT,
});
const MOCK_SEARCH_WORD = faker.string.alpha({ length: 8, casing: 'lower' });
const MOCK_PAST_THE_END_PAGE = 9;
const MOCK_FIRST_EXTRA_DOMAIN = `a-${MOCK_SEARCH_WORD}.example.com`;
const MOCK_SECOND_EXTRA_DOMAIN = `b-${MOCK_SEARCH_WORD}.example.com`;

const db = useQueryTestDb();

function toPageRow(tenant: TTenant): TTenantsPageRow {
  return {
    id: tenant.id,
    name: tenant.name,
    primaryDomain: tenant.primaryDomain,
    plan: tenant.plan,
    status: tenant.status,
    provisioningStatus: tenant.provisioningStatus,
    deprovisionedAt: tenant.deprovisionedAt,
    createdAt: tenant.createdAt,
  };
}

afterEach(async () => {
  await db().delete(schema.tenants);
});

describe(listTenantsPage, () => {
  describe('with three tenants', () => {
    let firstTenant: TTenant;
    let middleTenant: TTenant;
    let lastTenant: TTenant;

    beforeEach(async () => {
      lastTenant = await insertTestTenant(db(), { name: MOCK_LAST_NAME });
      firstTenant = await insertTestTenant(db(), { name: MOCK_FIRST_NAME });
      middleTenant = await insertTestTenant(db(), { name: MOCK_MIDDLE_NAME });
    });

    it('returns the first page capped at the page size with the full total', async () => {
      const result = await listTenantsPage({
        page: 1,
        pageSize: MOCK_PAGE_SIZE,
      });

      expect(result).toEqual({
        rows: [toPageRow(firstTenant), toPageRow(middleTenant)],
        total: 3,
      });
    });

    it('returns the remaining tenants on the second page', async () => {
      const result = await listTenantsPage({
        page: 2,
        pageSize: MOCK_PAGE_SIZE,
      });

      expect(result).toEqual({ rows: [toPageRow(lastTenant)], total: 3 });
    });

    it('returns no rows and the full total for a page past the end', async () => {
      const result = await listTenantsPage({
        page: MOCK_PAST_THE_END_PAGE,
        pageSize: MOCK_PAGE_SIZE,
      });

      expect(result).toEqual({ rows: [], total: 3 });
    });

    it('carries only the list columns on each row', async () => {
      const { rows } = await listTenantsPage({
        page: 1,
        pageSize: MOCK_PAGE_SIZE,
      });

      const [row] = rows;
      const expectedKeys = Object.keys({
        ...toPageRow(firstTenant),
        matchedDomain: undefined,
      });

      expect(Object.keys(row ?? {}).sort()).toEqual(expectedKeys.sort());
    });

    it('breaks a plan tie by name', async () => {
      const result = await listTenantsPage({
        page: 1,
        pageSize: MOCK_PAGE_SIZE,
        sort: {
          column: TENANT_SORT_COLUMN.PLAN,
          direction: SORT_DIRECTION.DESCENDING,
        },
      });

      expect(result.rows).toEqual([
        toPageRow(firstTenant),
        toPageRow(middleTenant),
      ]);
    });

    it('counts only the tenants matching the search', async () => {
      const result = await listTenantsPage({
        page: 1,
        pageSize: 1,
        search: MOCK_FIRST_NAME,
      });

      expect(result).toEqual({ rows: [toPageRow(firstTenant)], total: 1 });
    });
  });

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

    it('excludes deprovisioned tenants from rows and total by default', async () => {
      const result = await listTenantsPage({
        page: 1,
        pageSize: MOCK_PAGE_SIZE,
      });

      expect(result).toEqual({ rows: [toPageRow(activeTenant)], total: 1 });
    });

    it('includes deprovisioned tenants when includeArchived is true', async () => {
      const result = await listTenantsPage({
        page: 1,
        pageSize: MOCK_PAGE_SIZE,
        includeArchived: true,
      });

      expect(result).toEqual({
        rows: [toPageRow(activeTenant), toPageRow(archivedTenant)],
        total: 2,
      });
    });
  });

  it('orders newest first when sorted by created date descending', async () => {
    const olderTenant = await insertTestTenant(db(), {
      name: MOCK_FIRST_NAME,
      plan: TENANT_PLAN.GROWTH,
      createdAt: MOCK_OLDER_CREATED_AT,
    });
    const newerTenant = await insertTestTenant(db(), {
      name: MOCK_LAST_NAME,
      createdAt: MOCK_NEWER_CREATED_AT,
    });

    const result = await listTenantsPage({
      page: 1,
      pageSize: MOCK_PAGE_SIZE,
      sort: {
        column: TENANT_SORT_COLUMN.CREATED,
        direction: SORT_DIRECTION.DESCENDING,
      },
    });

    expect(result.rows).toEqual([
      toPageRow(newerTenant),
      toPageRow(olderTenant),
    ]);
  });

  it('returns no rows and a zero total when no tenants exist', async () => {
    const result = await listTenantsPage({ page: 1, pageSize: MOCK_PAGE_SIZE });

    expect(result).toEqual({ rows: [], total: 0 });
  });

  describe('with a search', () => {
    it('matches a name without reporting a matched address', async () => {
      const nameTenant = await insertTestTenant(db(), {
        name: `${MOCK_FIRST_NAME} ${MOCK_SEARCH_WORD}`,
      });
      await insertTestTenant(db(), { name: MOCK_LAST_NAME });

      const result = await listTenantsPage({
        page: 1,
        pageSize: MOCK_PAGE_SIZE,
        search: MOCK_SEARCH_WORD.toUpperCase(),
      });

      expect(result).toEqual({ rows: [toPageRow(nameTenant)], total: 1 });
    });

    it('matches a primary domain without reporting a matched address', async () => {
      const domainTenant = await insertTestTenant(db(), {
        name: MOCK_FIRST_NAME,
        primaryDomain: MOCK_FIRST_EXTRA_DOMAIN,
      });
      await insertTestTenant(db(), { name: MOCK_LAST_NAME });

      const result = await listTenantsPage({
        page: 1,
        pageSize: MOCK_PAGE_SIZE,
        search: MOCK_SEARCH_WORD,
      });

      expect(result).toEqual({ rows: [toPageRow(domainTenant)], total: 1 });
    });

    it('matches an extra domain and reports the first matching one', async () => {
      const extraDomainTenant = await insertTestTenant(db(), {
        name: MOCK_FIRST_NAME,
      });
      await insertTestTenantDomain(
        db(),
        extraDomainTenant.id,
        MOCK_SECOND_EXTRA_DOMAIN,
      );
      await insertTestTenantDomain(
        db(),
        extraDomainTenant.id,
        MOCK_FIRST_EXTRA_DOMAIN,
      );
      await insertTestTenant(db(), { name: MOCK_LAST_NAME });

      const result = await listTenantsPage({
        page: 1,
        pageSize: MOCK_PAGE_SIZE,
        search: MOCK_SEARCH_WORD,
      });

      expect(result).toEqual({
        rows: [
          {
            ...toPageRow(extraDomainTenant),
            matchedDomain: MOCK_FIRST_EXTRA_DOMAIN,
          },
        ],
        total: 1,
      });
    });
  });
});
