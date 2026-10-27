import { MEMBERSHIP_ROLE } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { insertTestTenant, insertTestUser } from '@blog/db/testing/fixtures';
import {
  mockMembership,
  MOCK_USER_ID,
} from '@blog/db/testing/memberships/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { faker } from '@faker-js/faker';

import {
  listMembershipsWithTenantsForUser,
  type TMembershipWithTenant,
} from './list-memberships-with-tenants-for-user';

vi.mock('@blog/db/client');

faker.seed(6022);

const MOCK_OTHER_USER_ID = faker.string.uuid();
const MOCK_DEPROVISIONED_AT = new Date('2026-01-01T00:00:00.000Z');

const db = useQueryTestDb();

function sortByMembershipId(
  rows: TMembershipWithTenant[],
): TMembershipWithTenant[] {
  return [...rows].sort((a, b) =>
    a.membership.id.localeCompare(b.membership.id),
  );
}

afterEach(async () => {
  await db().delete(schema.memberships);
  await db().delete(schema.tenants);
  await db().delete(schema.users);
});

describe(listMembershipsWithTenantsForUser, () => {
  beforeEach(async () => {
    await insertTestUser(db(), { id: MOCK_USER_ID });
  });

  it('returns every membership for the given user alongside its tenant', async () => {
    await insertTestUser(db(), { id: MOCK_OTHER_USER_ID });
    const tenantOne = await insertTestTenant(db());
    const tenantTwo = await insertTestTenant(db());
    const ownerMembership = await mockMembership(db(), {
      userId: MOCK_USER_ID,
      tenantId: tenantOne.id,
    });
    const readerMembership = await mockMembership(db(), {
      userId: MOCK_USER_ID,
      tenantId: tenantTwo.id,
      role: MEMBERSHIP_ROLE.READER,
    });
    await mockMembership(db(), {
      userId: MOCK_OTHER_USER_ID,
      tenantId: tenantOne.id,
      role: MEMBERSHIP_ROLE.EDITOR,
    });

    const result = await listMembershipsWithTenantsForUser(MOCK_USER_ID);

    expect(sortByMembershipId(result)).toEqual(
      sortByMembershipId([
        { membership: ownerMembership, tenant: tenantOne },
        { membership: readerMembership, tenant: tenantTwo },
      ]),
    );
  });

  it('includes a deprovisioned tenant', async () => {
    const tenant = await insertTestTenant(db(), {
      deprovisionedAt: MOCK_DEPROVISIONED_AT,
    });
    const membership = await mockMembership(db(), {
      userId: MOCK_USER_ID,
      tenantId: tenant.id,
    });

    const result = await listMembershipsWithTenantsForUser(MOCK_USER_ID);

    expect(result).toEqual([{ membership, tenant }]);
  });

  it('returns an empty array for a user with no memberships', async () => {
    const result = await listMembershipsWithTenantsForUser(MOCK_USER_ID);

    expect(result).toEqual([]);
  });
});
