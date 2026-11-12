import * as schema from '@blog/db/schema';
import {
  insertTestSubscriber,
  insertTestTenant,
  MOCK_SUBSCRIBER_EMAIL,
} from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { MOCK_ACTIVE_SUBSCRIBER } from '@blog/db/testing/subscribers/fixtures';
import { useTestTenant } from '@blog/db/testing/test-tenant';
import { faker } from '@faker-js/faker';
import { eq } from 'drizzle-orm';

import { listActiveSubscribers } from './list-active-subscribers';

vi.mock('@blog/db/client');

faker.seed(7159);

const MOCK_PAGE_SIZE = 2;
const MOCK_ACTIVE_EMAILS = Array.from({ length: 3 }, () =>
  faker.internet.email().toLowerCase(),
);
const MOCK_UNDECRYPTABLE_VALUE = 'not-an-encrypted-value';
const MOCK_PENDING_EMAIL = faker.internet.email().toLowerCase();

const db = useQueryTestDb();
const tenant = useTestTenant(db);

afterEach(async () => {
  await db().delete(schema.subscribers);
});

describe(listActiveSubscribers, () => {
  let tenantId: string;

  beforeEach(() => {
    ({ id: tenantId } = tenant());
  });

  it("pages through the tenant's active subscribers in id order with their addresses", async () => {
    const { id: otherTenantId } = await insertTestTenant(db());
    const active = await Promise.all(
      MOCK_ACTIVE_EMAILS.map(async (email) => {
        const { id } = await insertTestSubscriber(
          db(),
          tenantId,
          email,
          MOCK_ACTIVE_SUBSCRIBER,
        );
        return { id, email };
      }),
    );
    await insertTestSubscriber(db(), tenantId, MOCK_PENDING_EMAIL);
    await insertTestSubscriber(
      db(),
      otherTenantId,
      MOCK_SUBSCRIBER_EMAIL,
      MOCK_ACTIVE_SUBSCRIBER,
    );
    const expected = [...active].sort((a, b) => a.id.localeCompare(b.id));

    const firstPage = await listActiveSubscribers(
      tenantId,
      MOCK_PAGE_SIZE,
      undefined,
    );
    const secondPage = await listActiveSubscribers(
      tenantId,
      MOCK_PAGE_SIZE,
      firstPage.at(-1)?.id,
    );

    expect(firstPage).toEqual(expected.slice(0, MOCK_PAGE_SIZE));
    expect(secondPage).toEqual(expected.slice(MOCK_PAGE_SIZE));
  });

  it('lists an undecryptable address as undefined and reads the rest', async () => {
    const [unreadableEmail = '', readableEmail = ''] = MOCK_ACTIVE_EMAILS;
    const unreadable = await insertTestSubscriber(
      db(),
      tenantId,
      unreadableEmail,
      MOCK_ACTIVE_SUBSCRIBER,
    );
    const readable = await insertTestSubscriber(
      db(),
      tenantId,
      readableEmail,
      MOCK_ACTIVE_SUBSCRIBER,
    );
    await db()
      .update(schema.subscribers)
      .set({ emailEncrypted: MOCK_UNDECRYPTABLE_VALUE })
      .where(eq(schema.subscribers.id, unreadable.id));

    const page = await listActiveSubscribers(
      tenantId,
      MOCK_PAGE_SIZE,
      undefined,
    );

    expect(page).toEqual(
      expect.arrayContaining([
        { id: unreadable.id, email: undefined },
        { id: readable.id, email: readableEmail },
      ]),
    );
  });

  it('returns an empty page past the last subscriber', async () => {
    const { id } = await insertTestSubscriber(
      db(),
      tenantId,
      MOCK_SUBSCRIBER_EMAIL,
      MOCK_ACTIVE_SUBSCRIBER,
    );

    const page = await listActiveSubscribers(tenantId, MOCK_PAGE_SIZE, id);

    expect(page).toEqual([]);
  });
});
