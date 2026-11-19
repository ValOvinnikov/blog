import { faker } from '@faker-js/faker';
import * as schema from '@shinefold/db/schema';
import { insertTestUser } from '@shinefold/db/testing/fixtures';
import {
  mockMembership,
  MOCK_USER_ID,
} from '@shinefold/db/testing/memberships/fixtures';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';
import { useTestTenant } from '@shinefold/db/testing/test-tenant';

import { getMembership } from './get-membership';

vi.mock('@shinefold/db/client');

faker.seed(6022);

const db = useQueryTestDb();
const tenant = useTestTenant(db);

afterEach(async () => {
  await db().delete(schema.memberships);
  await db().delete(schema.users);
});

describe(getMembership, () => {
  beforeEach(async () => {
    await insertTestUser(db(), { id: MOCK_USER_ID });
  });

  it('returns the row for an existing (userId, tenantId) pair', async () => {
    const membership = await mockMembership(db(), {
      userId: MOCK_USER_ID,
      tenantId: tenant().id,
    });

    const result = await getMembership(MOCK_USER_ID, tenant().id);

    expect(result).toEqual(membership);
  });

  it('returns undefined when the user has no membership on that tenant', async () => {
    const result = await getMembership(MOCK_USER_ID, tenant().id);

    expect(result).toBeUndefined();
  });
});
