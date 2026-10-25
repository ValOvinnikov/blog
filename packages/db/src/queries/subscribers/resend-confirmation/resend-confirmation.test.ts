import { SUBSCRIBER_OUTCOME } from '@blog/config';
import { SUBSCRIBER_STATUS } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import {
  insertTestReader,
  insertTestSubscriber,
  insertTestTenant,
  MOCK_SUBSCRIBER_EMAIL,
} from '@blog/db/testing/fixtures';
import { usePersonalDataKeys } from '@blog/db/testing/personal-data';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { toOutcome } from '@blog/utils/to-outcome';
import { faker } from '@faker-js/faker';

import { resendConfirmation } from './resend-confirmation';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);
usePersonalDataKeys();

const NOT_PENDING = toOutcome(SUBSCRIBER_OUTCOME.NOT_PENDING);
const MOCK_CONFIRMATION_TOKEN = faker.string.uuid() as ReturnType<
  typeof crypto.randomUUID
>;

afterEach(async () => {
  await db().delete(schema.subscribers);
  await db().delete(schema.tenants);
  await db().delete(schema.users);
});

describe(resendConfirmation, () => {
  let userId: string;
  let tenantId: string;

  beforeEach(async () => {
    ({ id: userId } = await insertTestReader(db(), MOCK_SUBSCRIBER_EMAIL));
    ({ id: tenantId } = await insertTestTenant(db()));
  });

  it("returns the pending row's id, address and a token, leaving the row as is", async () => {
    const subscriber = await insertTestSubscriber(
      db(),
      tenantId,
      MOCK_SUBSCRIBER_EMAIL,
    );

    vi.spyOn(crypto, 'randomUUID').mockReturnValueOnce(MOCK_CONFIRMATION_TOKEN);

    const result = await resendConfirmation(tenantId, userId);

    expect(result).toEqual({
      ...toOutcome(SUBSCRIBER_OUTCOME.PENDING),
      subscriberId: subscriber.id,
      email: MOCK_SUBSCRIBER_EMAIL,
      confirmationToken: MOCK_CONFIRMATION_TOKEN,
    });
    expect(await db().select().from(schema.subscribers)).toEqual([subscriber]);
  });

  it('returns not-pending for an already-active subscriber', async () => {
    await insertTestSubscriber(db(), tenantId, MOCK_SUBSCRIBER_EMAIL, {
      status: SUBSCRIBER_STATUS.ACTIVE,
    });

    expect(await resendConfirmation(tenantId, userId)).toEqual(NOT_PENDING);
  });

  it('returns not-pending when the account has no subscription', async () => {
    expect(await resendConfirmation(tenantId, userId)).toEqual(NOT_PENDING);
  });
});
