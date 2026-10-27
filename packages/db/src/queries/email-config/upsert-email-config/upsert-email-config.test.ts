import * as schema from '@blog/db/schema';
import { MOCK_EMAIL_CONFIG } from '@blog/db/testing/email-config/fixtures';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { MOCK_MISSING_TENANT_ID } from '@blog/db/testing/tenants/fixtures';
import { faker } from '@faker-js/faker';

import { upsertEmailConfig } from './upsert-email-config';

vi.mock('@blog/db/client');

faker.seed(61013);

const MOCK_INVALID_EMAIL = faker.lorem.word();
const MOCK_UPDATED_SENDER_NAME = faker.company.name();

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
    const { senderName, replyToAddress } = MOCK_EMAIL_CONFIG;

    const result = await upsertEmailConfig(tenantId, {
      senderName,
      replyToAddress,
    });

    expect(result).toMatchObject({
      tenantId,
      senderName,
      replyToAddress,
      logoAssetUrl: undefined,
      footerPostalAddress: undefined,
    });
  });

  it('updates the existing row, leaving one row per tenant', async () => {
    await upsertEmailConfig(tenantId, {
      senderName: MOCK_EMAIL_CONFIG.senderName,
    });

    const result = await upsertEmailConfig(tenantId, {
      senderName: MOCK_UPDATED_SENDER_NAME,
    });

    const rows = await db().select().from(schema.emailConfig);
    expect(result.senderName).toBe(MOCK_UPDATED_SENDER_NAME);
    expect(rows).toHaveLength(1);
  });

  it('rejects a malformed reply-to address', async () => {
    await expect(
      upsertEmailConfig(tenantId, { replyToAddress: MOCK_INVALID_EMAIL }),
    ).rejects.toThrow();
  });

  it('stores the contact recipient override', async () => {
    const result = await upsertEmailConfig(tenantId, {
      contactRecipient: MOCK_EMAIL_CONFIG.contactRecipient,
    });

    expect(result.contactRecipient).toBe(MOCK_EMAIL_CONFIG.contactRecipient);
  });

  it('clears the contact recipient override when set to null', async () => {
    await upsertEmailConfig(tenantId, {
      contactRecipient: MOCK_EMAIL_CONFIG.contactRecipient,
    });

    const result = await upsertEmailConfig(tenantId, {
      contactRecipient: null,
    });

    expect(result.contactRecipient).toBeUndefined();
  });

  it('rejects a malformed contact recipient', async () => {
    await expect(
      upsertEmailConfig(tenantId, { contactRecipient: MOCK_INVALID_EMAIL }),
    ).rejects.toThrow();
  });

  it('rejects a tenantId with no matching tenants row', async () => {
    await expect(
      upsertEmailConfig(MOCK_MISSING_TENANT_ID, {
        senderName: MOCK_EMAIL_CONFIG.senderName,
      }),
    ).rejects.toThrow();
  });
});

describe('partial updates', () => {
  let tenantId: string;

  beforeEach(async () => {
    ({ id: tenantId } = await insertTestTenant(db()));
    await upsertEmailConfig(tenantId, {
      footerPostalAddress: MOCK_EMAIL_CONFIG.footerPostalAddress,
    });
  });

  it('preserves footerPostalAddress when a later update omits the field', async () => {
    const result = await upsertEmailConfig(tenantId, {
      senderName: MOCK_EMAIL_CONFIG.senderName,
    });

    expect(result.footerPostalAddress).toBe(
      MOCK_EMAIL_CONFIG.footerPostalAddress,
    );
  });

  it('clears footerPostalAddress when explicitly set to null', async () => {
    const result = await upsertEmailConfig(tenantId, {
      footerPostalAddress: null,
    });

    expect(result.footerPostalAddress).toBeUndefined();
  });
});
