import * as schema from '@blog/db/schema';
import {
  insertTestReader,
  insertTestSubscriber,
  insertTestTenant,
  insertTestUser,
  TEST_SUBSCRIBER_EMAIL,
  TEST_SUBSCRIBER_TAGGED_EMAIL,
} from '@blog/db/testing/fixtures';
import { usePersonalDataKeys } from '@blog/db/testing/personal-data';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { faker } from '@faker-js/faker';

import { findUserSubscriber } from './user-subscriber';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);
usePersonalDataKeys();

afterEach(async () => {
  await db().delete(schema.subscribers);
  await db().delete(schema.tenants);
  await db().delete(schema.users);
});

describe(findUserSubscriber, () => {
  let userId: string;
  let tenantId: string;

  beforeEach(async () => {
    ({ id: userId } = await insertTestReader(db(), TEST_SUBSCRIBER_EMAIL));
    ({ id: tenantId } = await insertTestTenant(db()));
  });

  it.each([
    ['the exact address', TEST_SUBSCRIBER_EMAIL],
    ['a re-cased, padded address', ` ${TEST_SUBSCRIBER_EMAIL.toUpperCase()} `],
  ])('finds the row stored under %s', async (_case, storedEmail) => {
    const { id, status } = await insertTestSubscriber(
      db(),
      tenantId,
      storedEmail,
    );

    const subscriber = await findUserSubscriber(tenantId, userId);

    expect(subscriber).toEqual({ id, status, email: storedEmail });
  });

  it('finds nothing for a +tag sibling of the account address', async () => {
    await insertTestSubscriber(db(), tenantId, TEST_SUBSCRIBER_TAGGED_EMAIL);

    expect(await findUserSubscriber(tenantId, userId)).toBeUndefined();
  });

  it('finds nothing for a +tag account whose plain address is subscribed', async () => {
    const { id } = await insertTestReader(db(), TEST_SUBSCRIBER_TAGGED_EMAIL);
    await insertTestSubscriber(db(), tenantId, TEST_SUBSCRIBER_EMAIL);

    expect(await findUserSubscriber(tenantId, id)).toBeUndefined();
  });

  it("finds nothing for the account's address on another tenant", async () => {
    const { id: otherTenantId } = await insertTestTenant(db());
    await insertTestSubscriber(db(), otherTenantId, TEST_SUBSCRIBER_EMAIL);

    expect(await findUserSubscriber(tenantId, userId)).toBeUndefined();
  });

  it.each([
    ['an unknown user', async () => faker.string.uuid()],
    ['a user without an email', async () => (await insertTestUser(db())).id],
  ])('finds nothing for %s', async (_case, user) => {
    await insertTestSubscriber(db(), tenantId, TEST_SUBSCRIBER_EMAIL);

    expect(await findUserSubscriber(tenantId, await user())).toBeUndefined();
  });
});
