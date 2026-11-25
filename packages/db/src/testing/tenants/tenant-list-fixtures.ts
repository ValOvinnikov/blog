import { TENANT_STATUS } from '@shinefold/db/constants';
import { insertTestTenant, type TTestDb } from '@shinefold/db/testing/fixtures';
import { MOCK_NOW } from '@shinefold/db/testing/frozen-clock';
import { createMockFaker } from '@shinefold/db/testing/mock-faker';
import { MOCK_DEPROVISIONED_AT } from '@shinefold/db/testing/tenants/fixtures';

const tenantListFaker = createMockFaker(8076);

export const MOCK_FIRST_NAME = `A ${tenantListFaker.company.name()}`;
export const MOCK_LAST_NAME = `Z ${tenantListFaker.company.name()}`;
export const MOCK_NEWER_CREATED_AT = tenantListFaker.date.recent({
  refDate: MOCK_NOW,
});
export const MOCK_OLDER_CREATED_AT = tenantListFaker.date.past({
  refDate: MOCK_NEWER_CREATED_AT,
});
export const MOCK_SEARCH_WORD = tenantListFaker.string.alpha({
  length: 8,
  casing: 'lower',
});
export const MOCK_SEARCH_SLUG = tenantListFaker.string.alpha({
  length: 10,
  casing: 'lower',
});
export const MOCK_FIRST_EXTRA_DOMAIN = `a-${MOCK_SEARCH_SLUG}.example.com`;
export const MOCK_SECOND_EXTRA_DOMAIN = `b-${MOCK_SEARCH_SLUG}.example.com`;

export async function insertActiveAndArchivedTenants(db: TTestDb) {
  const activeTenant = await insertTestTenant(db, { name: MOCK_FIRST_NAME });
  const archivedTenant = await insertTestTenant(db, {
    name: MOCK_LAST_NAME,
    status: TENANT_STATUS.ARCHIVED,
    deprovisionedAt: MOCK_DEPROVISIONED_AT,
  });

  return { activeTenant, archivedTenant };
}
