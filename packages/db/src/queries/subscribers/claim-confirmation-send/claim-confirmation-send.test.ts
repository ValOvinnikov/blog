import * as schema from '@blog/db/schema';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { eq } from 'drizzle-orm';

import { claimConfirmationSend } from './claim-confirmation-send';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);

const COOLDOWN_MS = 15 * 60_000;

afterEach(async () => {
  await db().delete(schema.subscribers);
  await db().delete(schema.tenants);
});

describe(claimConfirmationSend, () => {
  let tenantId: string;

  beforeEach(async () => {
    ({ id: tenantId } = await insertTestTenant(db()));
  });

  async function insertSubscriber(
    overrides: Partial<typeof schema.subscribers.$inferInsert> = {},
  ): Promise<schema.TSubscriber> {
    const [subscriber] = await db()
      .insert(schema.subscribers)
      .values({ tenantId, email: 'reader@example.com', ...overrides })
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

  it('claims a pending subscriber that has never been sent a confirmation', async () => {
    const { id } = await insertSubscriber();

    const claimedAt = await claimConfirmationSend(id, COOLDOWN_MS);

    expect(claimedAt).toBeInstanceOf(Date);
    await expect(readSentAt(id)).resolves.toEqual(claimedAt);
  });

  it('refuses a second claim inside the cooldown and keeps the first send time', async () => {
    const { id } = await insertSubscriber();
    const first = await claimConfirmationSend(id, COOLDOWN_MS);

    await expect(claimConfirmationSend(id, COOLDOWN_MS)).resolves.toBeNull();
    await expect(readSentAt(id)).resolves.toEqual(first);
  });

  it('claims again once the last send is older than the cooldown', async () => {
    const { id } = await insertSubscriber({
      confirmationSentAt: new Date(Date.now() - COOLDOWN_MS - 1000),
    });

    await expect(
      claimConfirmationSend(id, COOLDOWN_MS),
    ).resolves.toBeInstanceOf(Date);
  });

  it('lets exactly one of two concurrent claims through', async () => {
    const { id } = await insertSubscriber();

    const results = await Promise.all([
      claimConfirmationSend(id, COOLDOWN_MS),
      claimConfirmationSend(id, COOLDOWN_MS),
    ]);

    expect(results.filter((result) => result !== null)).toHaveLength(1);
  });

  it('never claims an active subscriber', async () => {
    const { id } = await insertSubscriber({
      status: 'active',
      confirmedAt: new Date(),
    });

    await expect(claimConfirmationSend(id, COOLDOWN_MS)).resolves.toBeNull();
    await expect(readSentAt(id)).resolves.toBeNull();
  });
});
