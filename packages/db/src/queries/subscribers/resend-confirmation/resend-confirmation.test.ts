import * as schema from '@blog/db/schema';
import { insertTestTenant, insertTestUser } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';

import { resendConfirmation } from './resend-confirmation';

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
  return insertTestUser(db(), { email: 'reader@example.com', ...overrides });
}

describe(resendConfirmation, () => {
  it('returns the existing confirmation token for a pending subscriber', async () => {
    const user = await insertUser();
    const { id: tenantId } = await insertTestTenant(db());
    const [subscriber] = await db()
      .insert(schema.subscribers)
      .values({ tenantId, email: 'reader@example.com' })
      .returning();
    if (!subscriber) throw new Error('failed to seed a subscriber row');

    const result = await resendConfirmation(tenantId, user.id);

    expect(result).toEqual({
      outcome: 'pending',
      confirmationToken: subscriber.confirmationToken,
      unsubscribeToken: subscriber.unsubscribeToken,
    });
  });

  it('does not rotate the token across repeated calls', async () => {
    const user = await insertUser();
    const { id: tenantId } = await insertTestTenant(db());
    await db()
      .insert(schema.subscribers)
      .values({ tenantId, email: 'reader@example.com' });

    const first = await resendConfirmation(tenantId, user.id);
    const second = await resendConfirmation(tenantId, user.id);

    expect(first).toEqual(second);
  });

  it('returns not-pending for an already-active subscriber', async () => {
    const user = await insertUser();
    const { id: tenantId } = await insertTestTenant(db());
    await db()
      .insert(schema.subscribers)
      .values({ tenantId, email: 'reader@example.com', status: 'active' });

    const result = await resendConfirmation(tenantId, user.id);

    expect(result).toEqual({ outcome: 'not-pending' });
  });

  it('returns not-pending when no subscriber row matches the account email', async () => {
    const user = await insertUser();
    const { id: tenantId } = await insertTestTenant(db());

    const result = await resendConfirmation(tenantId, user.id);

    expect(result).toEqual({ outcome: 'not-pending' });
  });

  it('returns not-pending for an unrecognized userId', async () => {
    const { id: tenantId } = await insertTestTenant(db());

    const result = await resendConfirmation(tenantId, 'does-not-exist');

    expect(result).toEqual({ outcome: 'not-pending' });
  });

  it('returns not-pending when the user has no email on file', async () => {
    const user = await insertUser({ email: null });
    const { id: tenantId } = await insertTestTenant(db());

    const result = await resendConfirmation(tenantId, user.id);

    expect(result).toEqual({ outcome: 'not-pending' });
  });

  it('returns not-pending when the subscriber row belongs to a different tenant', async () => {
    const user = await insertUser();
    const { id: tenantOneId } = await insertTestTenant(db());
    const { id: tenantTwoId } = await insertTestTenant(db());
    await db()
      .insert(schema.subscribers)
      .values({ tenantId: tenantOneId, email: 'reader@example.com' });

    const result = await resendConfirmation(tenantTwoId, user.id);

    expect(result).toEqual({ outcome: 'not-pending' });
  });
});
