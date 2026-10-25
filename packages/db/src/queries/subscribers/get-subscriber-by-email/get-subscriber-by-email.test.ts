import { SUBSCRIBER_STATUS } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import {
  insertTestTenant,
  MOCK_SUBSCRIBER_EMAIL,
} from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';

import { getSubscriberByEmail } from './get-subscriber-by-email';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);

afterEach(async () => {
  await db().delete(schema.subscribers);
  await db().delete(schema.tenants);
});

describe(getSubscriberByEmail, () => {
  let tenantId: string;

  beforeEach(async () => {
    ({ id: tenantId } = await insertTestTenant(db()));
  });

  it('returns the row for an existing email', async () => {
    await db()
      .insert(schema.subscribers)
      .values({ tenantId, email: MOCK_SUBSCRIBER_EMAIL });

    const result = await getSubscriberByEmail(tenantId, MOCK_SUBSCRIBER_EMAIL);

    expect(result).toMatchObject({
      email: MOCK_SUBSCRIBER_EMAIL,
      status: SUBSCRIBER_STATUS.PENDING,
    });
  });

  it('normalizes casing/whitespace before looking the row up', async () => {
    await db()
      .insert(schema.subscribers)
      .values({ tenantId, email: MOCK_SUBSCRIBER_EMAIL });

    const result = await getSubscriberByEmail(
      tenantId,
      `  ${MOCK_SUBSCRIBER_EMAIL.toUpperCase()}  `,
    );

    expect(result).toMatchObject({ email: MOCK_SUBSCRIBER_EMAIL });
  });

  it('returns undefined for an email with no row', async () => {
    const result = await getSubscriberByEmail(tenantId, 'nobody@example.com');

    expect(result).toBeUndefined();
  });

  it("returns undefined for another tenant's row with the same email", async () => {
    const { id: tenantOneId } = await insertTestTenant(db());
    const { id: tenantTwoId } = await insertTestTenant(db());
    await db()
      .insert(schema.subscribers)
      .values({ tenantId: tenantOneId, email: MOCK_SUBSCRIBER_EMAIL });

    const result = await getSubscriberByEmail(
      tenantTwoId,
      MOCK_SUBSCRIBER_EMAIL,
    );

    expect(result).toBeUndefined();
  });
});
