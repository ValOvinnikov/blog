import * as schema from '@blog/db/schema';
import { insertTestTenant, insertTestUser } from '@blog/db/testing/fixtures';
import {
  mockMembership,
  MOCK_USER_ID,
} from '@blog/db/testing/memberships/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { faker } from '@faker-js/faker';

import { getMembership } from './get-membership';

vi.mock('@blog/db/client');

faker.seed(6022);

const db = useQueryTestDb();

afterEach(async () => {
  await db().delete(schema.memberships);
  await db().delete(schema.tenants);
  await db().delete(schema.users);
});

describe(getMembership, () => {
  let tenantId: string;

  beforeEach(async () => {
    await insertTestUser(db(), { id: MOCK_USER_ID });
    ({ id: tenantId } = await insertTestTenant(db()));
  });

  it('returns the row for an existing (userId, tenantId) pair', async () => {
    const membership = await mockMembership(db(), {
      userId: MOCK_USER_ID,
      tenantId,
    });

    const result = await getMembership(MOCK_USER_ID, tenantId);

    expect(result).toEqual(membership);
  });

  it('returns undefined when the user has no membership on that tenant', async () => {
    const result = await getMembership(MOCK_USER_ID, tenantId);

    expect(result).toBeUndefined();
  });
});
