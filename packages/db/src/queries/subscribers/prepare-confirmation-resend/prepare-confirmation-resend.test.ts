import { SUBSCRIBER_OUTCOME } from '@blog/config';
import * as schema from '@blog/db/schema';
import {
  insertTestTenant,
  insertTestUser,
  TEST_SUBSCRIBER_EMAIL,
} from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { toOutcome } from '@blog/utils/to-outcome';
import { faker } from '@faker-js/faker';
import { eq } from 'drizzle-orm';

import { prepareConfirmationResend } from './prepare-confirmation-resend';

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
  return insertTestUser(db(), { email: TEST_SUBSCRIBER_EMAIL, ...overrides });
}

describe(prepareConfirmationResend, () => {
  let user: Awaited<ReturnType<typeof insertUser>>;
  let tenantId: string;

  beforeEach(async () => {
    user = await insertUser();
    ({ id: tenantId } = await insertTestTenant(db()));
  });

  it('returns the pending subscriber and a token without changing the row', async () => {
    const [subscriber] = await db()
      .insert(schema.subscribers)
      .values({ tenantId, email: TEST_SUBSCRIBER_EMAIL })
      .returning();
    if (!subscriber) throw new Error('failed to seed a subscriber row');

    const result = await prepareConfirmationResend(tenantId, user.id);

    expect(result).toEqual({
      ...toOutcome(SUBSCRIBER_OUTCOME.PENDING),
      subscriberId: subscriber.id,
      confirmationToken: expect.any(String),
    });
    const [row] = await db()
      .select()
      .from(schema.subscribers)
      .where(eq(schema.subscribers.id, subscriber.id));
    expect(row).toEqual(subscriber);
  });

  it('mints a fresh token on every call', async () => {
    await db()
      .insert(schema.subscribers)
      .values({ tenantId, email: TEST_SUBSCRIBER_EMAIL });

    const first = await prepareConfirmationResend(tenantId, user.id);
    const second = await prepareConfirmationResend(tenantId, user.id);

    expect(second).not.toEqual(first);
  });

  it('returns not-pending for an already-active subscriber', async () => {
    await db()
      .insert(schema.subscribers)
      .values({ tenantId, email: TEST_SUBSCRIBER_EMAIL, status: 'active' });

    const result = await prepareConfirmationResend(tenantId, user.id);

    expect(result).toEqual(toOutcome(SUBSCRIBER_OUTCOME.NOT_PENDING));
  });

  it('returns not-pending when no subscriber row matches the account email', async () => {
    const result = await prepareConfirmationResend(tenantId, user.id);

    expect(result).toEqual(toOutcome(SUBSCRIBER_OUTCOME.NOT_PENDING));
  });

  it('returns not-pending for an unrecognized userId', async () => {
    const result = await prepareConfirmationResend(
      tenantId,
      faker.string.uuid(),
    );

    expect(result).toEqual(toOutcome(SUBSCRIBER_OUTCOME.NOT_PENDING));
  });

  it('returns not-pending when the user has no email on file', async () => {
    const user = await insertUser({ email: null });

    const result = await prepareConfirmationResend(tenantId, user.id);

    expect(result).toEqual(toOutcome(SUBSCRIBER_OUTCOME.NOT_PENDING));
  });

  it('returns not-pending when the subscriber row belongs to a different tenant', async () => {
    const { id: tenantOneId } = await insertTestTenant(db());
    const { id: tenantTwoId } = await insertTestTenant(db());
    await db()
      .insert(schema.subscribers)
      .values({ tenantId: tenantOneId, email: TEST_SUBSCRIBER_EMAIL });

    const result = await prepareConfirmationResend(tenantTwoId, user.id);

    expect(result).toEqual(toOutcome(SUBSCRIBER_OUTCOME.NOT_PENDING));
  });
});
