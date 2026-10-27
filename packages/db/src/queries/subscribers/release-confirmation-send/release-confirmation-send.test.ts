import * as schema from '@blog/db/schema';
import {
  insertTestTenant,
  MOCK_SUBSCRIBER_EMAIL,
} from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { eq } from 'drizzle-orm';

import { releaseConfirmationSend } from './release-confirmation-send';

vi.mock('@blog/db/client');

const MOCK_CLAIMED_AT = new Date('2026-10-15T10:00:00.000Z');
const MOCK_NEWER_CLAIMED_AT = new Date('2026-10-15T10:20:00.000Z');

const db = useQueryTestDb();

afterEach(async () => {
  await db().delete(schema.subscribers);
  await db().delete(schema.tenants);
});

describe(releaseConfirmationSend, () => {
  let tenantId: string;

  beforeEach(async () => {
    ({ id: tenantId } = await insertTestTenant(db()));
  });

  async function insertSubscriberSentAt(confirmationSentAt: Date) {
    const [subscriber] = await db()
      .insert(schema.subscribers)
      .values({ tenantId, email: MOCK_SUBSCRIBER_EMAIL, confirmationSentAt })
      .returning();
    if (!subscriber) throw new Error('failed to seed a subscriber row');
    return subscriber;
  }

  async function readSentAt(id: string) {
    const [row] = await db()
      .select()
      .from(schema.subscribers)
      .where(eq(schema.subscribers.id, id));
    return row?.confirmationSentAt;
  }

  it('clears the send time it claimed', async () => {
    const { id } = await insertSubscriberSentAt(MOCK_CLAIMED_AT);

    await releaseConfirmationSend(id, MOCK_CLAIMED_AT);

    await expect(readSentAt(id)).resolves.toBeNull();
  });

  it('leaves a newer claim in place', async () => {
    const { id } = await insertSubscriberSentAt(MOCK_NEWER_CLAIMED_AT);

    await releaseConfirmationSend(id, MOCK_CLAIMED_AT);

    await expect(readSentAt(id)).resolves.toEqual(MOCK_NEWER_CLAIMED_AT);
  });
});
