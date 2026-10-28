import * as schema from '@blog/db/schema';
import {
  insertTestReader,
  insertTestSubscriber,
  insertTestTenant,
  insertTestUser,
  MOCK_SUBSCRIBER_EMAIL,
  MOCK_SUBSCRIBER_TAGGED_EMAIL,
} from '@blog/db/testing/fixtures';
import { MOCK_MISSING_USER_ID } from '@blog/db/testing/memberships/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';

import {
  findSubscriberByExactEmail,
  findUserSubscriber,
} from './user-subscriber';

vi.mock('@blog/db/client');

const MOCK_UNDECRYPTABLE_CIPHERTEXT = 'not-a-ciphertext';
const STORED_EMAIL_CASES = [
  ['the exact address', MOCK_SUBSCRIBER_EMAIL],
  ['a re-cased, padded address', ` ${MOCK_SUBSCRIBER_EMAIL.toUpperCase()} `],
] as const;

const db = useQueryTestDb();

afterEach(async () => {
  await db().delete(schema.subscribers);
  await db().delete(schema.tenants);
  await db().delete(schema.users);
});

describe(findUserSubscriber, () => {
  let userId: string;
  let tenantId: string;

  beforeEach(async () => {
    ({ id: userId } = await insertTestReader(db(), MOCK_SUBSCRIBER_EMAIL));
    ({ id: tenantId } = await insertTestTenant(db()));
  });

  it('finds the subscriber stored under the account address', async () => {
    const { id, status } = await insertTestSubscriber(
      db(),
      tenantId,
      MOCK_SUBSCRIBER_EMAIL,
    );

    const subscriber = await findUserSubscriber(tenantId, userId);

    expect(subscriber).toEqual({ id, status, email: MOCK_SUBSCRIBER_EMAIL });
  });

  it('finds nothing for a +tag account whose plain address is subscribed', async () => {
    const { id } = await insertTestReader(db(), MOCK_SUBSCRIBER_TAGGED_EMAIL);
    await insertTestSubscriber(db(), tenantId, MOCK_SUBSCRIBER_EMAIL);

    const subscriber = await findUserSubscriber(tenantId, id);

    expect(subscriber).toBeUndefined();
  });

  it.each([
    ['an unknown user', async () => MOCK_MISSING_USER_ID],
    ['a user without an email', async () => (await insertTestUser(db())).id],
  ])('finds nothing for %s', async (_case, user) => {
    await insertTestSubscriber(db(), tenantId, MOCK_SUBSCRIBER_EMAIL);

    const subscriber = await findUserSubscriber(tenantId, await user());

    expect(subscriber).toBeUndefined();
  });
});

describe(findSubscriberByExactEmail, () => {
  let tenantId: string;

  beforeEach(async () => {
    ({ id: tenantId } = await insertTestTenant(db()));
  });

  it.each(STORED_EMAIL_CASES)(
    'finds the row stored under %s',
    async (_case, storedEmail) => {
      const { id, status } = await insertTestSubscriber(
        db(),
        tenantId,
        storedEmail,
      );

      const subscriber = await findSubscriberByExactEmail(
        tenantId,
        MOCK_SUBSCRIBER_EMAIL,
      );

      expect(subscriber).toEqual({ id, status, email: storedEmail });
    },
  );

  it('skips the +tag sibling and returns the exact address row', async () => {
    await insertTestSubscriber(db(), tenantId, MOCK_SUBSCRIBER_TAGGED_EMAIL);
    const { id, status } = await insertTestSubscriber(
      db(),
      tenantId,
      MOCK_SUBSCRIBER_EMAIL,
    );

    const subscriber = await findSubscriberByExactEmail(
      tenantId,
      MOCK_SUBSCRIBER_EMAIL,
    );

    expect(subscriber).toEqual({
      id,
      status,
      email: MOCK_SUBSCRIBER_EMAIL,
    });
  });

  it('finds nothing when only a +tag sibling is stored', async () => {
    await insertTestSubscriber(db(), tenantId, MOCK_SUBSCRIBER_TAGGED_EMAIL);

    const subscriber = await findSubscriberByExactEmail(
      tenantId,
      MOCK_SUBSCRIBER_EMAIL,
    );

    expect(subscriber).toBeUndefined();
  });

  it('finds nothing for the same address on another tenant', async () => {
    const { id: otherTenantId } = await insertTestTenant(db());
    await insertTestSubscriber(db(), otherTenantId, MOCK_SUBSCRIBER_EMAIL);

    const subscriber = await findSubscriberByExactEmail(
      tenantId,
      MOCK_SUBSCRIBER_EMAIL,
    );

    expect(subscriber).toBeUndefined();
  });

  it('rejects when a +tag sibling row cannot be decrypted', async () => {
    await insertTestSubscriber(db(), tenantId, MOCK_SUBSCRIBER_EMAIL);
    await insertTestSubscriber(db(), tenantId, MOCK_SUBSCRIBER_TAGGED_EMAIL, {
      emailEncrypted: MOCK_UNDECRYPTABLE_CIPHERTEXT,
    });

    await expect(
      findSubscriberByExactEmail(tenantId, MOCK_SUBSCRIBER_EMAIL),
    ).rejects.toThrow();
  });
});
