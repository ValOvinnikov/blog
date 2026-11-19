import { faker } from '@faker-js/faker';
import { userPersonalColumns } from '@shinefold/db/queries/users/user-personal-data/user-personal-data';
import * as schema from '@shinefold/db/schema';
import {
  insertTestUser,
  MOCK_OWNER_EMAIL,
} from '@shinefold/db/testing/fixtures';
import {
  mockMembership,
  MOCK_USER_ID,
} from '@shinefold/db/testing/memberships/fixtures';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';
import { useTestTenant } from '@shinefold/db/testing/test-tenant';

import { getTenantOwnerEmail } from './get-tenant-owner-email';

vi.mock('@shinefold/db/client');

faker.seed(6022);

const db = useQueryTestDb();
const tenant = useTestTenant(db);

afterEach(async () => {
  await db().delete(schema.memberships);
  await db().delete(schema.users);
});

describe(getTenantOwnerEmail, () => {
  it('returns the OWNER membership user email for the tenant', async () => {
    await insertTestUser(db(), {
      id: MOCK_USER_ID,
      ...userPersonalColumns({ email: MOCK_OWNER_EMAIL }),
    });
    await mockMembership(db(), { userId: MOCK_USER_ID, tenantId: tenant().id });

    const result = await getTenantOwnerEmail(tenant().id);

    expect(result).toBe(MOCK_OWNER_EMAIL);
  });

  it('returns undefined when the tenant has no OWNER membership or invite', async () => {
    const result = await getTenantOwnerEmail(tenant().id);

    expect(result).toBeUndefined();
  });
});
