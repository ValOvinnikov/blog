import * as schema from '@blog/db/schema';
import { createTestDb } from '@blog/db/testing/create-test-db';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

import { upsertEmailConfig } from './upsert-email-config';

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

describe(upsertEmailConfig, () => {
  it('inserts a new row when the tenant has no email config yet', async () => {
    const { id: tenantId } = await insertTestTenant(db);

    const result = await upsertEmailConfig(tenantId, {
      senderName: 'Acme Weekly',
      replyToAddress: 'support@example.com',
    });

    expect(result).toMatchObject({
      tenantId,
      senderName: 'Acme Weekly',
      replyToAddress: 'support@example.com',
      logoAssetUrl: undefined,
      footerPostalAddress: undefined,
    });
  });

  it('updates the existing row in place rather than inserting a second one', async () => {
    const { id: tenantId } = await insertTestTenant(db);
    await upsertEmailConfig(tenantId, { senderName: 'Acme Weekly' });

    const result = await upsertEmailConfig(tenantId, {
      senderName: 'Acme Digest',
    });

    expect(result.senderName).toBe('Acme Digest');
    const rows = await db.select().from(schema.emailConfig);
    expect(rows).toHaveLength(1);
  });

  it('rejects a malformed reply-to address', async () => {
    const { id: tenantId } = await insertTestTenant(db);

    await expect(
      upsertEmailConfig(tenantId, { replyToAddress: 'not-an-email' }),
    ).rejects.toThrow();
  });

  it('rejects a tenantId with no matching tenants row', async () => {
    await expect(
      upsertEmailConfig('00000000-0000-0000-0000-000000000000', {
        senderName: 'Acme Weekly',
      }),
    ).rejects.toThrow();
  });
});

describe('partial updates — omission leaves a field untouched, explicit null clears it', () => {
  it('preserves footerPostalAddress when a later update omits the field', async () => {
    const { id: tenantId } = await insertTestTenant(db);
    await upsertEmailConfig(tenantId, {
      footerPostalAddress: '123 Main St, Springfield',
    });

    const result = await upsertEmailConfig(tenantId, {
      senderName: 'Acme Weekly',
    });

    expect(result.footerPostalAddress).toBe('123 Main St, Springfield');
  });

  it('clears footerPostalAddress when explicitly set to null', async () => {
    const { id: tenantId } = await insertTestTenant(db);
    await upsertEmailConfig(tenantId, {
      footerPostalAddress: '123 Main St, Springfield',
    });

    const result = await upsertEmailConfig(tenantId, {
      footerPostalAddress: null,
    });

    expect(result.footerPostalAddress).toBeUndefined();
  });
});
