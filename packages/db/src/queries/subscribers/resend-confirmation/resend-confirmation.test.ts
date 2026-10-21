import * as schema from '@blog/db/schema';
import { insertTestTenant, insertTestUser } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { hashToken } from '@blog/utils/hash-token';
import { eq } from 'drizzle-orm';

import { resendConfirmation } from './resend-confirmation';

const READER_EMAIL = 'reader@example.com';
const NOT_PENDING = { outcome: 'not-pending' };

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);

afterEach(async () => {
  await db().delete(schema.subscribers);
  await db().delete(schema.tenants);
  await db().delete(schema.users);
});

async function insertUser(
  overrides: Partial<typeof schema.users.$inferInsert> = {},
): Promise<schema.TUser> {
  return insertTestUser(db(), { email: READER_EMAIL, ...overrides });
}

describe(resendConfirmation, () => {
  let user: Awaited<ReturnType<typeof insertUser>>;
  let tenantId: string;

  beforeEach(async () => {
    user = await insertUser();
    ({ id: tenantId } = await insertTestTenant(db()));
  });

  it('returns fresh tokens for a pending subscriber and stores only their hashes', async () => {
    const [subscriber] = await db()
      .insert(schema.subscribers)
      .values({ tenantId, email: READER_EMAIL })
      .returning();
    if (!subscriber) throw new Error('failed to seed a subscriber row');

    const result = await resendConfirmation(tenantId, user.id);
    if (result.outcome !== 'pending') throw new Error('expected pending');

    const [row] = await db()
      .select()
      .from(schema.subscribers)
      .where(eq(schema.subscribers.id, subscriber.id));
    expect(row?.confirmationTokenHash).toBe(
      hashToken(result.confirmationToken),
    );
    expect(row?.unsubscribeTokenHash).toBe(hashToken(result.unsubscribeToken));
  });

  it('rotates the tokens on every call', async () => {
    await db()
      .insert(schema.subscribers)
      .values({ tenantId, email: READER_EMAIL });

    const first = await resendConfirmation(tenantId, user.id);
    const second = await resendConfirmation(tenantId, user.id);

    expect(second).not.toEqual(first);
  });

  it('returns not-pending for an already-active subscriber', async () => {
    await db()
      .insert(schema.subscribers)
      .values({ tenantId, email: READER_EMAIL, status: 'active' });

    const result = await resendConfirmation(tenantId, user.id);

    expect(result).toEqual(NOT_PENDING);
  });

  it('returns not-pending when no subscriber row matches the account email', async () => {
    const result = await resendConfirmation(tenantId, user.id);

    expect(result).toEqual(NOT_PENDING);
  });

  it('returns not-pending for an unrecognized userId', async () => {
    const result = await resendConfirmation(tenantId, 'does-not-exist');

    expect(result).toEqual(NOT_PENDING);
  });

  it('returns not-pending when the user has no email on file', async () => {
    const user = await insertUser({ email: null });

    const result = await resendConfirmation(tenantId, user.id);

    expect(result).toEqual(NOT_PENDING);
  });

  it('returns not-pending when the subscriber row belongs to a different tenant', async () => {
    const { id: tenantOneId } = await insertTestTenant(db());
    const { id: tenantTwoId } = await insertTestTenant(db());
    await db()
      .insert(schema.subscribers)
      .values({ tenantId: tenantOneId, email: READER_EMAIL });

    const result = await resendConfirmation(tenantTwoId, user.id);

    expect(result).toEqual(NOT_PENDING);
  });
});
