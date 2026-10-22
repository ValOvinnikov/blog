import * as schema from '@blog/db/schema';
import {
  insertTestReader,
  insertTestSubscriber,
  insertTestTenant,
  insertTestUser,
  TEST_SUBSCRIBER_EMAIL,
} from '@blog/db/testing/fixtures';
import { usePersonalDataKeys } from '@blog/db/testing/personal-data';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';

import { getSubscriptionStatus } from './get-subscription-status';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);
usePersonalDataKeys();

const NOT_SUBSCRIBED = { outcome: 'not-subscribed' };

afterEach(async () => {
  await db().delete(schema.subscribers);
  await db().delete(schema.tenants);
  await db().delete(schema.users);
});

describe(getSubscriptionStatus, () => {
  let userId: string;
  let tenantId: string;

  beforeEach(async () => {
    ({ id: userId } = await insertTestReader(db(), TEST_SUBSCRIBER_EMAIL));
    ({ id: tenantId } = await insertTestTenant(db()));
  });

  it('returns active for a user whose account email has an active subscriber row', async () => {
    await insertTestSubscriber(db(), tenantId, TEST_SUBSCRIBER_EMAIL, {
      status: 'active',
    });

    const result = await getSubscriptionStatus(tenantId, userId);

    expect(result).toEqual({ outcome: 'active' });
  });

  it('returns pending for a user whose account email has a pending subscriber row', async () => {
    await insertTestSubscriber(db(), tenantId, TEST_SUBSCRIBER_EMAIL);

    const result = await getSubscriptionStatus(tenantId, userId);

    expect(result).toEqual({ outcome: 'pending' });
  });

  it('returns not-subscribed when no subscriber row matches the account email', async () => {
    const result = await getSubscriptionStatus(tenantId, userId);

    expect(result).toEqual(NOT_SUBSCRIBED);
  });

  it('returns not-subscribed when the user has no email on file', async () => {
    const { id } = await insertTestUser(db());

    const result = await getSubscriptionStatus(tenantId, id);

    expect(result).toEqual(NOT_SUBSCRIBED);
  });

  it('returns not-subscribed for an unrecognized userId', async () => {
    const result = await getSubscriptionStatus(tenantId, 'does-not-exist');

    expect(result).toEqual(NOT_SUBSCRIBED);
  });

  it('matches a subscriber stored under a differently cased or tagged address of the same mailbox', async () => {
    const [localPart, domain] = TEST_SUBSCRIBER_EMAIL.split('@');
    await insertTestSubscriber(
      db(),
      tenantId,
      `${localPart}+news@${domain?.toUpperCase()}`,
    );

    const result = await getSubscriptionStatus(tenantId, userId);

    expect(result).toEqual({ outcome: 'pending' });
  });

  it('returns not-subscribed when the subscriber row belongs to a different tenant', async () => {
    const { id: otherTenantId } = await insertTestTenant(db());
    await insertTestSubscriber(db(), otherTenantId, TEST_SUBSCRIBER_EMAIL);

    const result = await getSubscriptionStatus(tenantId, userId);

    expect(result).toEqual(NOT_SUBSCRIBED);
  });
});
