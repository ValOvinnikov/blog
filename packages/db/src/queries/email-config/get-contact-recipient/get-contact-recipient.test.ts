import { MEMBERSHIP_ROLE } from '@shinefold/db/constants';
import * as schema from '@shinefold/db/schema';
import {
  MOCK_EMAIL_CONFIG,
  insertTestEmailConfig,
} from '@shinefold/db/testing/email-config/fixtures';
import {
  insertTestTenant,
  insertTestReader,
  MOCK_OWNER_EMAIL,
} from '@shinefold/db/testing/fixtures';
import { mockMembership } from '@shinefold/db/testing/memberships/fixtures';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';

import { getContactRecipient } from './get-contact-recipient';

vi.mock('@shinefold/db/client');

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
    await mockMembership(db(), {
      userId: ownerId,
      tenantId,
      role: MEMBERSHIP_ROLE.OWNER,
    });
  });

  it('returns the override when one is set', async () => {
    await insertTestEmailConfig(db(), tenantId, {
      contactRecipient: MOCK_EMAIL_CONFIG.contactRecipient,
    });

    const result = await getContactRecipient(tenantId);

    expect(result).toBe(MOCK_EMAIL_CONFIG.contactRecipient);
  });

  it("falls back to the owner's email when the override is unset", async () => {
    await insertTestEmailConfig(db(), tenantId);

    const result = await getContactRecipient(tenantId);

    expect(result).toBe(MOCK_OWNER_EMAIL);
  });

  it("falls back to the owner's email without an email config row", async () => {
    const result = await getContactRecipient(tenantId);

    expect(result).toBe(MOCK_OWNER_EMAIL);
  });
});
