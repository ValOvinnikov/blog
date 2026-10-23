import { SUBSCRIBER_OUTCOME } from '@blog/config';
import * as schema from '@blog/db/schema';
import {
  insertTestSubscriber,
  insertTestTenant,
  TEST_SUBSCRIBER_EMAIL,
} from '@blog/db/testing/fixtures';
import { usePersonalDataKeys } from '@blog/db/testing/personal-data';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { mintConfirmationToken } from '@blog/db/utils/subscriber-tokens/subscriber-tokens';
import { toOutcome } from '@blog/utils/to-outcome';
import { faker } from '@faker-js/faker';
import { eq } from 'drizzle-orm';

import { confirmSubscriber } from './confirm-subscriber';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);
usePersonalDataKeys();

async function readSubscriber(id: string): Promise<schema.TSubscriber> {
  const [row] = await db()
    .select()
    .from(schema.subscribers)
    .where(eq(schema.subscribers.id, id));
  if (!row) throw new Error(`No subscriber "${id}".`);
  return row;
}

afterEach(async () => {
  await db().delete(schema.subscribers);
  await db().delete(schema.tenants);
});

describe(confirmSubscriber, () => {
  let tenantId: string;
  let otherTenantId: string;
  let subscriberId: string;
  let confirmationToken: string;
  let confirmationTokenHash: string;

  beforeEach(async () => {
    ({ id: tenantId } = await insertTestTenant(db()));
    ({ id: otherTenantId } = await insertTestTenant(db()));
    ({ confirmationToken, confirmationTokenHash } = mintConfirmationToken());
    ({ id: subscriberId } = await insertTestSubscriber(
      db(),
      tenantId,
      TEST_SUBSCRIBER_EMAIL,
      { confirmationTokenHash },
    ));
  });

  it('activates a pending subscriber and stamps the confirmation time', async () => {
    const result = await confirmSubscriber(tenantId, confirmationToken);

    expect(result).toEqual(toOutcome(SUBSCRIBER_OUTCOME.CONFIRMED));
    const { status, confirmedAt } = await readSubscriber(subscriberId);
    expect(status).toBe('active');
    expect(confirmedAt).toBeInstanceOf(Date);
  });

  it('reports a second confirm as already confirmed and keeps the first time', async () => {
    await confirmSubscriber(tenantId, confirmationToken);
    const { confirmedAt } = await readSubscriber(subscriberId);

    const second = await confirmSubscriber(tenantId, confirmationToken);

    expect(second).toEqual(toOutcome(SUBSCRIBER_OUTCOME.ALREADY_CONFIRMED));
    expect((await readSubscriber(subscriberId)).confirmedAt).toEqual(
      confirmedAt,
    );
  });

  it.each([
    ['an unknown token', () => faker.string.uuid(), () => tenantId],
    ['the stored hash', () => confirmationTokenHash, () => tenantId],
    ["another tenant's token", () => confirmationToken, () => otherTenantId],
  ])('returns not-found for %s', async (_case, token, tenant) => {
    const result = await confirmSubscriber(tenant(), token());

    expect(result).toEqual(toOutcome(SUBSCRIBER_OUTCOME.NOT_FOUND));
  });

  it('confirms exactly once when the same link is opened twice at once', async () => {
    const results = await Promise.all([
      confirmSubscriber(tenantId, confirmationToken),
      confirmSubscriber(tenantId, confirmationToken),
    ]);

    expect(results.map(({ outcome }) => outcome).sort()).toEqual([
      SUBSCRIBER_OUTCOME.ALREADY_CONFIRMED,
      SUBSCRIBER_OUTCOME.CONFIRMED,
    ]);
  });
});
