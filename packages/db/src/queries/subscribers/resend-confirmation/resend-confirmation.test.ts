import { SUBSCRIBER_OUTCOME } from '@blog/config';
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
import { toOutcome } from '@blog/utils/to-outcome';
import { faker } from '@faker-js/faker';
import { eq } from 'drizzle-orm';

import { resendConfirmation } from './resend-confirmation';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);
usePersonalDataKeys();

afterEach(async () => {
  await db().delete(schema.subscribers);
  await db().delete(schema.tenants);
  await db().delete(schema.users);
});

describe(resendConfirmation, () => {
  let userId: string;
  let tenantId: string;

  beforeEach(async () => {
    ({ id: userId } = await insertTestReader(db(), TEST_SUBSCRIBER_EMAIL));
    ({ id: tenantId } = await insertTestTenant(db()));
  });

  it('returns the pending subscriber and a token without changing the row', async () => {
    const subscriber = await insertTestSubscriber(
      db(),
      tenantId,
      TEST_SUBSCRIBER_EMAIL,
    );

    const result = await resendConfirmation(tenantId, userId);

    expect(result).toEqual({
      ...toOutcome(SUBSCRIBER_OUTCOME.PENDING),
      subscriberId: subscriber.id,
      email: TEST_SUBSCRIBER_EMAIL,
      confirmationToken: expect.any(String),
    });
    const [row] = await db()
      .select()
      .from(schema.subscribers)
      .where(eq(schema.subscribers.id, subscriber.id));
    expect(row).toEqual(subscriber);
  });

  it('mints a fresh token on every call', async () => {
    await insertTestSubscriber(db(), tenantId, TEST_SUBSCRIBER_EMAIL);

    const first = await resendConfirmation(tenantId, userId);
    const second = await resendConfirmation(tenantId, userId);

    expect(second).not.toEqual(first);
  });

  it('returns not-pending for an already-active subscriber', async () => {
    await insertTestSubscriber(db(), tenantId, TEST_SUBSCRIBER_EMAIL, {
      status: 'active',
    });

    const result = await resendConfirmation(tenantId, userId);

    expect(result).toEqual(toOutcome(SUBSCRIBER_OUTCOME.NOT_PENDING));
  });

  it('returns not-pending when no subscriber row matches the account email', async () => {
    const result = await resendConfirmation(tenantId, userId);

    expect(result).toEqual(toOutcome(SUBSCRIBER_OUTCOME.NOT_PENDING));
  });

  it('returns not-pending for an unrecognized userId', async () => {
    const result = await resendConfirmation(tenantId, faker.string.uuid());

    expect(result).toEqual(toOutcome(SUBSCRIBER_OUTCOME.NOT_PENDING));
  });

  it('returns not-pending when the user has no email on file', async () => {
    const { id } = await insertTestUser(db());

    const result = await resendConfirmation(tenantId, id);

    expect(result).toEqual(toOutcome(SUBSCRIBER_OUTCOME.NOT_PENDING));
  });

  it('returns not-pending when the subscriber row belongs to a different tenant', async () => {
    const { id: otherTenantId } = await insertTestTenant(db());
    await insertTestSubscriber(db(), otherTenantId, TEST_SUBSCRIBER_EMAIL);

    const result = await resendConfirmation(tenantId, userId);

    expect(result).toEqual(toOutcome(SUBSCRIBER_OUTCOME.NOT_PENDING));
  });

  it('returns not-pending for an account whose tagged address only shares the index of a pending row', async () => {
    const { id } = await insertTestReader(db(), TEST_SUBSCRIBER_TAGGED_EMAIL);
    await insertTestSubscriber(db(), tenantId, TEST_SUBSCRIBER_EMAIL);

    const result = await resendConfirmation(tenantId, id);

    expect(result).toEqual(toOutcome(SUBSCRIBER_OUTCOME.NOT_PENDING));
  });
});
