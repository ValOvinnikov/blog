import { faker } from '@faker-js/faker';
import { SUBSCRIBER_OUTCOME } from '@shinefold/config';
import { SUBSCRIBER_STATUS } from '@shinefold/db/constants';
import * as schema from '@shinefold/db/schema';
import {
  insertTestReader,
  insertTestSubscriber,
  MOCK_SUBSCRIBER_EMAIL,
} from '@shinefold/db/testing/fixtures';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';
import { useTestTenant } from '@shinefold/db/testing/test-tenant';
import { toOutcome } from '@shinefold/utils/to-outcome';

import { resendConfirmation } from './resend-confirmation';

vi.mock('@shinefold/db/client');

faker.seed(1);

const db = useQueryTestDb();
const tenant = useTestTenant(db);

const NOT_PENDING = toOutcome(SUBSCRIBER_OUTCOME.NOT_PENDING);
const MOCK_CONFIRMATION_TOKEN = faker.string.uuid() as ReturnType<
  typeof crypto.randomUUID
>;

afterEach(async () => {
  await db().delete(schema.subscribers);
  await db().delete(schema.users);
});

describe(resendConfirmation, () => {
  let userId: string;

  beforeEach(async () => {
    ({ id: userId } = await insertTestReader(db(), MOCK_SUBSCRIBER_EMAIL));
  });

  it("returns the pending row's id, address and a token, leaving the row as is", async () => {
    const subscriber = await insertTestSubscriber(
      db(),
      tenant().id,
      MOCK_SUBSCRIBER_EMAIL,
    );

    vi.spyOn(crypto, 'randomUUID').mockReturnValueOnce(MOCK_CONFIRMATION_TOKEN);

    const result = await resendConfirmation(tenant().id, userId);

    const rows = await db().select().from(schema.subscribers);

    expect(result).toEqual({
      ...toOutcome(SUBSCRIBER_OUTCOME.PENDING),
      subscriberId: subscriber.id,
      email: MOCK_SUBSCRIBER_EMAIL,
      confirmationToken: MOCK_CONFIRMATION_TOKEN,
    });
    expect(rows).toEqual([subscriber]);
  });

  it('returns not-pending for an already-active subscriber', async () => {
    await insertTestSubscriber(db(), tenant().id, MOCK_SUBSCRIBER_EMAIL, {
      status: SUBSCRIBER_STATUS.ACTIVE,
    });

    const result = await resendConfirmation(tenant().id, userId);

    expect(result).toEqual(NOT_PENDING);
  });

  it('returns not-pending when the account has no subscription', async () => {
    const result = await resendConfirmation(tenant().id, userId);

    expect(result).toEqual(NOT_PENDING);
  });
});
