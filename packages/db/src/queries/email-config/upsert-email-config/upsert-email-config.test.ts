import { faker } from '@faker-js/faker';
import * as schema from '@shinefold/db/schema';
import { MOCK_EMAIL_CONFIG } from '@shinefold/db/testing/email-config/fixtures';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';
import { MOCK_MISSING_TENANT_ID } from '@shinefold/db/testing/tenants/fixtures';
import { useTestTenant } from '@shinefold/db/testing/test-tenant';

import { upsertEmailConfig } from './upsert-email-config';

vi.mock('@shinefold/db/client');

faker.seed(61013);

const MOCK_INVALID_EMAIL = faker.lorem.word();
const MOCK_UPDATED_SENDER_NAME = faker.company.name();

const db = useQueryTestDb();
const tenant = useTestTenant(db);

afterEach(async () => {
  await db().delete(schema.emailConfig);
});

describe(upsertEmailConfig, () => {
  it('inserts a new row when the tenant has no email config yet', async () => {
    const { senderName, replyToAddress } = MOCK_EMAIL_CONFIG;

    const result = await upsertEmailConfig(tenant().id, {
      senderName,
      replyToAddress,
    });

    expect(result).toMatchObject({
      tenantId: tenant().id,
      senderName,
      replyToAddress,
      logoAssetUrl: undefined,
      footerPostalAddress: undefined,
    });
  });

  it('turns emailing new posts off and leaves it off on a later save', async () => {
    await upsertEmailConfig(tenant().id, { emailNewPosts: false });

    const result = await upsertEmailConfig(tenant().id, {
      senderName: MOCK_EMAIL_CONFIG.senderName,
    });

    expect(result.emailNewPosts).toBe(false);
  });

  it('updates the existing row, leaving one row per tenant', async () => {
    await upsertEmailConfig(tenant().id, {
      senderName: MOCK_EMAIL_CONFIG.senderName,
    });

    const result = await upsertEmailConfig(tenant().id, {
      senderName: MOCK_UPDATED_SENDER_NAME,
    });

    const rows = await db().select().from(schema.emailConfig);
    expect(result.senderName).toBe(MOCK_UPDATED_SENDER_NAME);
    expect(rows).toHaveLength(1);
  });

  it('rejects a malformed reply-to address', async () => {
    await expect(
      upsertEmailConfig(tenant().id, { replyToAddress: MOCK_INVALID_EMAIL }),
    ).rejects.toThrow();
  });

  it('stores the contact recipient override', async () => {
    const result = await upsertEmailConfig(tenant().id, {
      contactRecipient: MOCK_EMAIL_CONFIG.contactRecipient,
    });

    expect(result.contactRecipient).toBe(MOCK_EMAIL_CONFIG.contactRecipient);
  });

  it('clears the contact recipient override when set to null', async () => {
    await upsertEmailConfig(tenant().id, {
      contactRecipient: MOCK_EMAIL_CONFIG.contactRecipient,
    });

    const result = await upsertEmailConfig(tenant().id, {
      contactRecipient: null,
    });

    expect(result.contactRecipient).toBeUndefined();
  });

  it('rejects a malformed contact recipient', async () => {
    await expect(
      upsertEmailConfig(tenant().id, { contactRecipient: MOCK_INVALID_EMAIL }),
    ).rejects.toThrow();
  });

  it('rejects a tenantId with no matching tenants row', async () => {
    await expect(
      upsertEmailConfig(MOCK_MISSING_TENANT_ID, {
        senderName: MOCK_EMAIL_CONFIG.senderName,
      }),
    ).rejects.toThrow();
  });

  describe('partial updates', () => {
    beforeEach(async () => {
      await upsertEmailConfig(tenant().id, {
        footerPostalAddress: MOCK_EMAIL_CONFIG.footerPostalAddress,
      });
    });

    it('preserves footerPostalAddress when a later update omits the field', async () => {
      const result = await upsertEmailConfig(tenant().id, {
        senderName: MOCK_EMAIL_CONFIG.senderName,
      });

      expect(result.footerPostalAddress).toBe(
        MOCK_EMAIL_CONFIG.footerPostalAddress,
      );
    });

    it('clears footerPostalAddress when explicitly set to null', async () => {
      const result = await upsertEmailConfig(tenant().id, {
        footerPostalAddress: null,
      });

      expect(result.footerPostalAddress).toBeUndefined();
    });
  });
});
