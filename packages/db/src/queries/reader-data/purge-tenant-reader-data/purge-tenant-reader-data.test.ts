import { faker } from '@faker-js/faker';
import { MEMBERSHIP_ROLE } from '@shinefold/db/constants';
import { addBookmark } from '@shinefold/db/queries/bookmarks';
import { createMembershipInvite } from '@shinefold/db/queries/membership-invites';
import * as schema from '@shinefold/db/schema';
import {
  insertTestLead,
  insertTestSubscriber,
  insertTestTenant,
  insertTestUser,
  MOCK_SUBSCRIBER_EMAIL,
} from '@shinefold/db/testing/fixtures';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';

import {
  countTenantReaderData,
  purgeTenantReaderData,
} from './purge-tenant-reader-data';

vi.mock('@shinefold/db/client');

const db = useQueryTestDb();

faker.seed(6022);

const MOCK_POST_ID = faker.string.uuid();

const ONE_OF_EACH = {
  subscribers: 1,
  bookmarks: 1,
  membershipInvites: 1,
  leads: 1,
};
const NONE = { subscribers: 0, bookmarks: 0, membershipInvites: 0, leads: 0 };

async function seedReaderData(tenantId: string): Promise<void> {
  const user = await insertTestUser(db());
  await insertTestSubscriber(db(), tenantId, MOCK_SUBSCRIBER_EMAIL);
  await addBookmark(tenantId, user.id, MOCK_POST_ID);
  await createMembershipInvite(
    tenantId,
    MOCK_SUBSCRIBER_EMAIL,
    MEMBERSHIP_ROLE.EDITOR,
  );
  await insertTestLead(db(), tenantId);
}

afterEach(async () => {
  await db().delete(schema.subscribers);
  await db().delete(schema.bookmarks);
  await db().delete(schema.membershipInvites);
  await db().delete(schema.leads);
  await db().delete(schema.tenants);
  await db().delete(schema.users);
});

describe(purgeTenantReaderData, () => {
  let tenantId: string;

  beforeEach(async () => {
    ({ id: tenantId } = await insertTestTenant(db()));
    await seedReaderData(tenantId);
  });

  it('purges the tenant reader data and returns the counts', async () => {
    const purged = await purgeTenantReaderData(tenantId);
    const remaining = await countTenantReaderData(tenantId);

    expect(purged).toEqual(ONE_OF_EACH);
    expect(remaining).toEqual(NONE);
  });

  it('deletes nothing on a second run', async () => {
    await purgeTenantReaderData(tenantId);

    const secondRun = await purgeTenantReaderData(tenantId);

    expect(secondRun).toEqual(NONE);
  });

  it("leaves another tenant's reader data untouched", async () => {
    const { id: otherTenantId } = await insertTestTenant(db());
    await seedReaderData(otherTenantId);

    await purgeTenantReaderData(tenantId);

    const otherTenantCounts = await countTenantReaderData(otherTenantId);

    expect(otherTenantCounts).toEqual(ONE_OF_EACH);
  });
});
