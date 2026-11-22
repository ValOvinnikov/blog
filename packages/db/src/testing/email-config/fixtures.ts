import * as schema from '@shinefold/db/schema';
import type { TEmailConfig } from '@shinefold/db/schema/email-config';
import { firstRowOrThrow } from '@shinefold/db/testing/first-row-or-throw';
import type { TTestDb } from '@shinefold/db/testing/fixtures';
import { createMockFaker } from '@shinefold/db/testing/mock-faker';

const emailConfigFaker = createMockFaker(61002);

export const MOCK_EMAIL_CONFIG = {
  logoAssetUrl: emailConfigFaker.internet.url(),
  senderName: emailConfigFaker.company.name(),
  replyToAddress: emailConfigFaker.internet.email().toLowerCase(),
  footerPostalAddress: emailConfigFaker.location.streetAddress(),
  contactRecipient: emailConfigFaker.internet.email().toLowerCase(),
};

export async function insertTestEmailConfig(
  db: TTestDb,
  tenantId: string,
  overrides: Partial<typeof schema.emailConfig.$inferInsert> = {},
): Promise<TEmailConfig> {
  return firstRowOrThrow(
    await db
      .insert(schema.emailConfig)
      .values({ tenantId, ...overrides })
      .returning(),
    'insertTestEmailConfig',
  );
}
