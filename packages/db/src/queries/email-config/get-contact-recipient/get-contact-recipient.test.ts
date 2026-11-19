import { MEMBERSHIP_ROLE } from '@shinefold/db/constants';
import * as schema from '@shinefold/db/schema';
import { MOCK_EMAIL_CONFIG } from '@shinefold/db/testing/email-config/fixtures';
import {
  insertTestReader,
  MOCK_OWNER_EMAIL,
} from '@shinefold/db/testing/fixtures';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';
import { useTestTenant } from '@shinefold/db/testing/test-tenant';

import { getContactRecipient } from './get-contact-recipient';

vi.mock('@shinefold/db/client');

const db = useQueryTestDb();
const tenant = useTestTenant(db);

afterEach(async () => {
  await db().delete(schema.emailConfig);
  await db().delete(schema.memberships);
  await db().delete(schema.users);
});

describe(getContactRecipient, () => {
  beforeEach(async () => {
    const { id: ownerId } = await insertTestReader(db(), MOCK_OWNER_EMAIL);
    await db().insert(schema.memberships).values({
      userId: ownerId,
      tenantId: tenant().id,
      role: MEMBERSHIP_ROLE.OWNER,
    });
  });

  it('returns the override when one is set', async () => {
    await db().insert(schema.emailConfig).values({
      tenantId: tenant().id,
      contactRecipient: MOCK_EMAIL_CONFIG.contactRecipient,
    });

    const result = await getContactRecipient(tenant().id);

    expect(result).toBe(MOCK_EMAIL_CONFIG.contactRecipient);
  });

  it("falls back to the owner's email when the override is unset", async () => {
    await db().insert(schema.emailConfig).values({ tenantId: tenant().id });

    const result = await getContactRecipient(tenant().id);

    expect(result).toBe(MOCK_OWNER_EMAIL);
  });

  it("falls back to the owner's email without an email config row", async () => {
    const result = await getContactRecipient(tenant().id);

    expect(result).toBe(MOCK_OWNER_EMAIL);
  });
});
