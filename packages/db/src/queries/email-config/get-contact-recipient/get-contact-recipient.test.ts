import { MEMBERSHIP_ROLE } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { MOCK_EMAIL_CONFIG } from '@blog/db/testing/email-config/fixtures';
import {
  insertTestTenant,
  insertTestReader,
  MOCK_OWNER_EMAIL,
} from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';

import { getContactRecipient } from './get-contact-recipient';

vi.mock('@blog/db/client');

const db = useQueryTestDb();

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
    const { id: ownerId } = await insertTestReader(db(), MOCK_OWNER_EMAIL);
    await db().insert(schema.memberships).values({
      userId: ownerId,
      tenantId,
      role: MEMBERSHIP_ROLE.OWNER,
    });
  });

  it('returns the override when one is set', async () => {
    await db().insert(schema.emailConfig).values({
      tenantId,
      contactRecipient: MOCK_EMAIL_CONFIG.contactRecipient,
    });

    const result = await getContactRecipient(tenantId);

    expect(result).toBe(MOCK_EMAIL_CONFIG.contactRecipient);
  });

  it("falls back to the owner's email when the override is unset", async () => {
    await db().insert(schema.emailConfig).values({ tenantId });

    const result = await getContactRecipient(tenantId);

    expect(result).toBe(MOCK_OWNER_EMAIL);
  });

  it("falls back to the owner's email without an email config row", async () => {
    const result = await getContactRecipient(tenantId);

    expect(result).toBe(MOCK_OWNER_EMAIL);
  });
});
