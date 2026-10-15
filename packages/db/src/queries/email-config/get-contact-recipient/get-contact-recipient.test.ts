import { MEMBERSHIP_ROLE } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { insertTestTenant, insertTestUser } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';

import { getContactRecipient } from './get-contact-recipient';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);

afterEach(async () => {
  await db().delete(schema.emailConfig);
  await db().delete(schema.memberships);
  await db().delete(schema.tenants);
  await db().delete(schema.users);
});

describe(getContactRecipient, () => {
  let tenantId: string;

  beforeEach(async () => {
    ({ id: tenantId } = await insertTestTenant(db()));
    await insertTestUser(db(), { id: 'owner-1', email: 'owner@example.com' });
    await db().insert(schema.memberships).values({
      userId: 'owner-1',
      tenantId,
      role: MEMBERSHIP_ROLE.OWNER,
    });
  });

  it('returns the override when one is set', async () => {
    await db()
      .insert(schema.emailConfig)
      .values({ tenantId, contactRecipient: 'leads@example.com' });

    const result = await getContactRecipient(tenantId);

    expect(result).toBe('leads@example.com');
  });

  it("falls back to the owner's email when the override is unset", async () => {
    await db().insert(schema.emailConfig).values({ tenantId });

    const result = await getContactRecipient(tenantId);

    expect(result).toBe('owner@example.com');
  });

  it("falls back to the owner's email when the tenant has no email config row", async () => {
    const result = await getContactRecipient(tenantId);

    expect(result).toBe('owner@example.com');
  });
});
