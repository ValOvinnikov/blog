import { faker } from '@faker-js/faker';
import { SUBSCRIBER_OUTCOME } from '@shinefold/config';
import { SUBSCRIBER_STATUS } from '@shinefold/db/constants';
import * as schema from '@shinefold/db/schema';
import {
  insertTestSubscriber,
  insertTestTenant,
  MOCK_SUBSCRIBER_EMAIL,
} from '@shinefold/db/testing/fixtures';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';
import {
  MOCK_CONFIRMATION_NOW,
  readTestSubscriber,
} from '@shinefold/db/testing/subscribers/fixtures';
import { mintConfirmationToken } from '@shinefold/db/utils/subscriber-tokens/subscriber-tokens';
import { toOutcome } from '@shinefold/utils/to-outcome';

import { confirmSubscriber } from './confirm-subscriber';

vi.mock('@shinefold/db/client');

faker.seed(5802);

const MOCK_UNKNOWN_TOKEN = faker.string.uuid();
const ONE_HOUR_MS = 60 * 60_000;

const db = useQueryTestDb();

beforeEach(() => {
  vi.useFakeTimers({ now: MOCK_CONFIRMATION_NOW, toFake: ['Date'] });
});

afterEach(async () => {
  vi.useRealTimers();
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
      MOCK_SUBSCRIBER_EMAIL,
      { confirmationTokenHash },
    ));
  });

  it('activates a pending subscriber and stamps the confirmation time', async () => {
    const result = await confirmSubscriber(tenantId, confirmationToken);

    const { status, confirmedAt } = await readTestSubscriber(
      db(),
      subscriberId,
    );
    expect(result).toEqual(toOutcome(SUBSCRIBER_OUTCOME.CONFIRMED));
    expect(status).toBe(SUBSCRIBER_STATUS.ACTIVE);
    expect(confirmedAt).toEqual(MOCK_CONFIRMATION_NOW);
  });

  it('reports a second confirm as already confirmed and keeps the first time', async () => {
    await confirmSubscriber(tenantId, confirmationToken);
    vi.setSystemTime(new Date(MOCK_CONFIRMATION_NOW.getTime() + ONE_HOUR_MS));

    const second = await confirmSubscriber(tenantId, confirmationToken);

    const { confirmedAt } = await readTestSubscriber(db(), subscriberId);
    expect(second).toEqual(toOutcome(SUBSCRIBER_OUTCOME.ALREADY_CONFIRMED));
    expect(confirmedAt).toEqual(MOCK_CONFIRMATION_NOW);
  });

  it.each([
    ['an unknown token', () => MOCK_UNKNOWN_TOKEN, () => tenantId],
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

    const outcomes = results.map(({ outcome }) => outcome).sort();
    expect(outcomes).toEqual([
      SUBSCRIBER_OUTCOME.ALREADY_CONFIRMED,
      SUBSCRIBER_OUTCOME.CONFIRMED,
    ]);
  });
});
