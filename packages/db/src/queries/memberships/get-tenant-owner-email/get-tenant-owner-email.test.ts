import * as schema from '@blog/db/schema';
import {
  insertTestTenant,
  insertTestUser,
  MOCK_OWNER_EMAIL,
} from '@blog/db/testing/fixtures';
import {
  mockMembership,
  MOCK_USER_ID,
} from '@blog/db/testing/memberships/fixtures';
import { usePersonalDataKeys } from '@blog/db/testing/personal-data';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { faker } from '@faker-js/faker';

import { getTenantOwnerEmail } from './get-tenant-owner-email';

vi.mock('@blog/db/client');

faker.seed(6022);

const db = useQueryTestDb();
usePersonalDataKeys();

afterEach(async () => {
  await db().delete(schema.memberships);
  await db().delete(schema.tenants);
  await db().delete(schema.users);
});

describe(getTenantOwnerEmail, () => {
  let tenantId: string;

  beforeEach(async () => {
    ({ id: tenantId } = await insertTestTenant(db()));
  });

  it('returns the OWNER membership user email for the tenant', async () => {
    await insertTestUser(db(), { id: MOCK_USER_ID, email: MOCK_OWNER_EMAIL });
    await mockMembership(db(), { userId: MOCK_USER_ID, tenantId });

    const result = await getTenantOwnerEmail(tenantId);

    expect(result).toBe(MOCK_OWNER_EMAIL);
  });

  it('returns undefined when the tenant has no OWNER membership or invite', async () => {
    const result = await getTenantOwnerEmail(tenantId);

    expect(result).toBeUndefined();
  });
});
