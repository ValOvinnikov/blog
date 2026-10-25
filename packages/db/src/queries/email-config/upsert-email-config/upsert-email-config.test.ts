import * as schema from '@blog/db/schema';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { MOCK_MISSING_TENANT_ID } from '@blog/db/testing/tenants/fixtures';

import { upsertEmailConfig } from './upsert-email-config';

vi.mock('@blog/db/client');

const MOCK_SENDER_NAME = 'Acme Weekly';
const MOCK_REPLY_TO = 'support@example.com';
const MOCK_INVALID_EMAIL = 'not-an-email';
const MOCK_CONTACT_RECIPIENT = 'leads@example.com';
const MOCK_POSTAL_ADDRESS = '123 Main St, Springfield';

const MOCK_UPDATED_SENDER_NAME = 'Acme Digest';

const db = useQueryTestDb();

afterEach(async () => {
  await db().delete(schema.emailConfig);
  await db().delete(schema.tenants);
});

describe(upsertEmailConfig, () => {
  let tenantId: string;

  beforeEach(async () => {
    ({ id: tenantId } = await insertTestTenant(db()));
  });

  it('inserts a new row when the tenant has no email config yet', async () => {
    const result = await upsertEmailConfig(tenantId, {
      senderName: MOCK_SENDER_NAME,
      replyToAddress: MOCK_REPLY_TO,
    });

    expect(result).toMatchObject({
      tenantId,
      senderName: MOCK_SENDER_NAME,
      replyToAddress: MOCK_REPLY_TO,
      logoAssetUrl: undefined,
      footerPostalAddress: undefined,
    });
  });

  it('updates the existing row in place rather than inserting a second one', async () => {
    await upsertEmailConfig(tenantId, { senderName: MOCK_SENDER_NAME });

    const result = await upsertEmailConfig(tenantId, {
      senderName: MOCK_UPDATED_SENDER_NAME,
    });

    expect(result.senderName).toBe(MOCK_UPDATED_SENDER_NAME);
    const rows = await db().select().from(schema.emailConfig);
    expect(rows).toHaveLength(1);
  });

  it('rejects a malformed reply-to address', async () => {
    await expect(
      upsertEmailConfig(tenantId, { replyToAddress: MOCK_INVALID_EMAIL }),
    ).rejects.toThrow();
  });

  it('stores and clears the contact recipient override', async () => {
    const set = await upsertEmailConfig(tenantId, {
      contactRecipient: MOCK_CONTACT_RECIPIENT,
    });
    const cleared = await upsertEmailConfig(tenantId, {
      contactRecipient: null,
    });

    expect(set.contactRecipient).toBe(MOCK_CONTACT_RECIPIENT);
    expect(cleared.contactRecipient).toBeUndefined();
  });

  it('rejects a malformed contact recipient', async () => {
    await expect(
      upsertEmailConfig(tenantId, { contactRecipient: MOCK_INVALID_EMAIL }),
    ).rejects.toThrow();
  });

  it('rejects a tenantId with no matching tenants row', async () => {
    await expect(
      upsertEmailConfig(MOCK_MISSING_TENANT_ID, {
        senderName: MOCK_SENDER_NAME,
      }),
    ).rejects.toThrow();
  });
});

describe('partial updates — omission leaves a field untouched, explicit null clears it', () => {
  let tenantId: string;

  beforeEach(async () => {
    ({ id: tenantId } = await insertTestTenant(db()));
  });

  it('preserves footerPostalAddress when a later update omits the field', async () => {
    await upsertEmailConfig(tenantId, {
      footerPostalAddress: MOCK_POSTAL_ADDRESS,
    });

    const result = await upsertEmailConfig(tenantId, {
      senderName: MOCK_SENDER_NAME,
    });

    expect(result.footerPostalAddress).toBe(MOCK_POSTAL_ADDRESS);
  });

  it('clears footerPostalAddress when explicitly set to null', async () => {
    await upsertEmailConfig(tenantId, {
      footerPostalAddress: MOCK_POSTAL_ADDRESS,
    });

    const result = await upsertEmailConfig(tenantId, {
      footerPostalAddress: null,
    });

    expect(result.footerPostalAddress).toBeUndefined();
  });
});
