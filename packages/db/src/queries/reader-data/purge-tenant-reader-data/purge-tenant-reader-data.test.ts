import { MEMBERSHIP_ROLE } from '@blog/db/constants';
import { addBookmark } from '@blog/db/queries/bookmarks';
import { createMembershipInvite } from '@blog/db/queries/membership-invites';
import * as schema from '@blog/db/schema';
import {
  insertTestLead,
  insertTestTenant,
  insertTestUser,
  TEST_SUBSCRIBER_EMAIL,
} from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';

import {
  countTenantReaderData,
  purgeTenantReaderData,
} from './purge-tenant-reader-data';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);

const ONE_OF_EACH = {
  subscribers: 1,
  bookmarks: 1,
  membershipInvites: 1,
  leads: 1,
};
const NONE = { subscribers: 0, bookmarks: 0, membershipInvites: 0, leads: 0 };

async function seedReaderData(tenantId: string): Promise<void> {
  const user = await insertTestUser(db());
  await db()
    .insert(schema.subscribers)
    .values({ tenantId, email: TEST_SUBSCRIBER_EMAIL });
  await addBookmark(tenantId, user.id, 'purged-post');
  await createMembershipInvite(
    tenantId,
    TEST_SUBSCRIBER_EMAIL,
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

  it('deletes the subscribers, bookmarks, invites and leads and returns the counts', async () => {
    await expect(purgeTenantReaderData(tenantId)).resolves.toEqual(ONE_OF_EACH);

    await expect(countTenantReaderData(tenantId)).resolves.toEqual(NONE);
  });

  it('deletes nothing on a second run', async () => {
    await purgeTenantReaderData(tenantId);

    await expect(purgeTenantReaderData(tenantId)).resolves.toEqual(NONE);
  });

  it("leaves another tenant's reader data untouched", async () => {
    const { id: otherTenantId } = await insertTestTenant(db());
    await seedReaderData(otherTenantId);

    await purgeTenantReaderData(tenantId);

    await expect(countTenantReaderData(otherTenantId)).resolves.toEqual(
      ONE_OF_EACH,
    );
  });
});
