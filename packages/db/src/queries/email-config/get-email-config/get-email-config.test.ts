import * as schema from '@blog/db/schema';
import { createTestDb } from '@blog/db/testing/create-test-db';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

import { getEmailConfig } from './get-email-config';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

let db: PgliteDatabase<typeof schema>;

beforeAll(async () => {
  db = await createTestDb();
}, 30_000);

beforeEach(() => {
  getDbMock.mockReturnValue(db);
});

afterEach(async () => {
  await db.delete(schema.emailConfig);
  await db.delete(schema.tenants);
});

describe(getEmailConfig, () => {
  it('returns undefined when the tenant has no email config row', async () => {
    const { id: tenantId } = await insertTestTenant(db);

    const result = await getEmailConfig(tenantId);

    expect(result).toBeUndefined();
  });

  it('maps null columns to undefined', async () => {
    const { id: tenantId } = await insertTestTenant(db);
    await db.insert(schema.emailConfig).values({ tenantId });

    const result = await getEmailConfig(tenantId);

    expect(result).toMatchObject({
      tenantId,
      logoAssetUrl: undefined,
      senderName: undefined,
      replyToAddress: undefined,
      footerPostalAddress: undefined,
    });
  });

  it('returns every set field', async () => {
    const { id: tenantId } = await insertTestTenant(db);
    await db.insert(schema.emailConfig).values({
      tenantId,
      logoAssetUrl: 'https://blob.example.com/email-logo.png',
      senderName: 'Acme Weekly',
      replyToAddress: 'support@example.com',
      footerPostalAddress: '123 Main St, Springfield',
    });

    const result = await getEmailConfig(tenantId);

    expect(result).toMatchObject({
      logoAssetUrl: 'https://blob.example.com/email-logo.png',
      senderName: 'Acme Weekly',
      replyToAddress: 'support@example.com',
      footerPostalAddress: '123 Main St, Springfield',
    });
  });
});
