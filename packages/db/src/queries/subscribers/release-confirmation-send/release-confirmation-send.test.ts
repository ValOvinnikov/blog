import * as schema from '@blog/db/schema';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { eq } from 'drizzle-orm';

import { releaseConfirmationSend } from './release-confirmation-send';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);

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
      .values({ tenantId, email: 'reader@example.com', confirmationSentAt })
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
    const claimedAt = new Date('2026-10-15T10:00:00.000Z');
    const { id } = await insertSubscriberSentAt(claimedAt);

    await releaseConfirmationSend(id, claimedAt);

    await expect(readSentAt(id)).resolves.toBeNull();
  });

  it('leaves a newer claim in place', async () => {
    const newerClaim = new Date('2026-10-15T10:20:00.000Z');
    const { id } = await insertSubscriberSentAt(newerClaim);

    await releaseConfirmationSend(id, new Date('2026-10-15T10:00:00.000Z'));

    await expect(readSentAt(id)).resolves.toEqual(newerClaim);
  });
});
