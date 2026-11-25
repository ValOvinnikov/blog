import { faker } from '@faker-js/faker';
import {
  SORT_DIRECTION,
  TENANT_PLAN,
  TENANT_SORT_COLUMN,
} from '@shinefold/config/constants';
import * as schema from '@shinefold/db/schema';
import type { TTenant } from '@shinefold/db/schema/tenants';
import { insertTestTenant } from '@shinefold/db/testing/fixtures';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';
import { insertTestTenantDomain } from '@shinefold/db/testing/tenant-domains/fixtures';
import {
  insertActiveAndArchivedTenants,
  MOCK_FIRST_EXTRA_DOMAIN,
  MOCK_FIRST_NAME,
  MOCK_LAST_NAME,
  MOCK_NEWER_CREATED_AT,
  MOCK_OLDER_CREATED_AT,
  MOCK_SEARCH_SLUG,
  MOCK_SEARCH_WORD,
  MOCK_SECOND_EXTRA_DOMAIN,
} from '@shinefold/db/testing/tenants/tenant-list-fixtures';

import { listTenantsPage, type TTenantsPageRow } from './list-tenants-page';

vi.mock('@shinefold/db/client');

faker.seed(8076);

const MOCK_PAGE_SIZE = 2;
const MOCK_MIDDLE_NAME = `M ${faker.company.name()}`;
const MOCK_PAST_THE_END_PAGE = 9;

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
  });

  describe('with an active and a deprovisioned tenant', () => {
    let activeTenant: TTenant;
    let archivedTenant: TTenant;

    beforeEach(async () => {
      ({ activeTenant, archivedTenant } =
        await insertActiveAndArchivedTenants(db()));
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

    it('counts deprovisioned tenants on a page past the end when included', async () => {
      const result = await listTenantsPage({
        page: MOCK_PAST_THE_END_PAGE,
        pageSize: MOCK_PAGE_SIZE,
        includeArchived: true,
      });

      expect(result).toEqual({ rows: [], total: 2 });
    });
  });

  it('breaks a tie on name by id', async () => {
    const firstInserted = await insertTestTenant(db(), {
      name: MOCK_FIRST_NAME,
      primaryDomain: MOCK_FIRST_EXTRA_DOMAIN,
    });
    const secondInserted = await insertTestTenant(db(), {
      name: MOCK_FIRST_NAME,
      primaryDomain: MOCK_SECOND_EXTRA_DOMAIN,
    });
    const isFirstLower = firstInserted.id < secondInserted.id;
    const lowerIdTenant = isFirstLower ? firstInserted : secondInserted;
    const higherIdTenant = isFirstLower ? secondInserted : firstInserted;

    const firstPage = await listTenantsPage({ page: 1, pageSize: 1 });
    const secondPage = await listTenantsPage({ page: 2, pageSize: 1 });

    expect([firstPage.rows, secondPage.rows]).toEqual([
      [toPageRow(lowerIdTenant)],
      [toPageRow(higherIdTenant)],
    ]);
  });

  it('orders higher plans first when sorted by plan descending', async () => {
    const freeTenant = await insertTestTenant(db(), {
      name: MOCK_FIRST_NAME,
      plan: TENANT_PLAN.FREE,
    });
    const growthTenant = await insertTestTenant(db(), {
      name: MOCK_LAST_NAME,
      plan: TENANT_PLAN.GROWTH,
    });

    const result = await listTenantsPage({
      page: 1,
      pageSize: MOCK_PAGE_SIZE,
      sort: {
        column: TENANT_SORT_COLUMN.PLAN,
        direction: SORT_DIRECTION.DESCENDING,
      },
    });

    expect(result.rows).toEqual([
      toPageRow(growthTenant),
      toPageRow(freeTenant),
    ]);
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
    describe('matching two of three tenants', () => {
      let firstMatch: TTenant;

      beforeEach(async () => {
        firstMatch = await insertTestTenant(db(), {
          name: `${MOCK_FIRST_NAME} ${MOCK_SEARCH_WORD}`,
        });
        await insertTestTenant(db(), {
          name: `${MOCK_LAST_NAME} ${MOCK_SEARCH_WORD}`,
        });
        await insertTestTenant(db(), { name: MOCK_MIDDLE_NAME });
      });

      it('counts every match beyond the rows on the page', async () => {
        const result = await listTenantsPage({
          page: 1,
          pageSize: 1,
          search: MOCK_SEARCH_WORD,
        });

        expect(result).toEqual({ rows: [toPageRow(firstMatch)], total: 2 });
      });

      it('counts every match on a page past the end', async () => {
        const result = await listTenantsPage({
          page: MOCK_PAST_THE_END_PAGE,
          pageSize: 1,
          search: MOCK_SEARCH_WORD,
        });

        expect(result).toEqual({ rows: [], total: 2 });
      });
    });

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
        search: MOCK_SEARCH_SLUG,
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
        search: MOCK_SEARCH_SLUG,
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
