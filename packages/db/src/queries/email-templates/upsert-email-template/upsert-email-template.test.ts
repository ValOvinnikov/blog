import { EMAIL_TEMPLATE_TYPE } from '@blog/config/constants';
import { EMAIL_TEMPLATE_DEFAULT_COPY } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { createTestDb } from '@blog/db/testing/create-test-db';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

import { upsertEmailTemplate } from './upsert-email-template';

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
  await db.delete(schema.emailTemplates);
  await db.delete(schema.tenants);
});

describe(upsertEmailTemplate, () => {
  it('inserts a new row with only the provided fields set', async () => {
    const { id: tenantId } = await insertTestTenant(db);

    const result = await upsertEmailTemplate(
      tenantId,
      EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
      { subject: 'Custom sign-in subject' },
    );

    expect(result.subject).toBe('Custom sign-in subject');
    expect(result.body).toEqual(EMAIL_TEMPLATE_DEFAULT_COPY.MAGIC_LINK.body);
  });

  it('updates the existing row in place rather than inserting a second one', async () => {
    const { id: tenantId } = await insertTestTenant(db);
    await upsertEmailTemplate(tenantId, EMAIL_TEMPLATE_TYPE.MAGIC_LINK, {
      subject: 'First subject',
    });

    const result = await upsertEmailTemplate(
      tenantId,
      EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
      { subject: 'Second subject' },
    );

    expect(result.subject).toBe('Second subject');
    const rows = await db.select().from(schema.emailTemplates);
    expect(rows).toHaveLength(1);
  });

  it('rejects a subject longer than its cap', async () => {
    const { id: tenantId } = await insertTestTenant(db);

    await expect(
      upsertEmailTemplate(tenantId, EMAIL_TEMPLATE_TYPE.MAGIC_LINK, {
        subject: 'x'.repeat(201),
      }),
    ).rejects.toThrow();
  });

  it('rejects a body block missing _type or _key', async () => {
    const { id: tenantId } = await insertTestTenant(db);

    await expect(
      upsertEmailTemplate(tenantId, EMAIL_TEMPLATE_TYPE.MAGIC_LINK, {
        body: [{ text: 'no _type or _key' } as never],
      }),
    ).rejects.toThrow();
  });

  it('rejects a tenantId with no matching tenants row', async () => {
    await expect(
      upsertEmailTemplate(
        '00000000-0000-0000-0000-000000000000',
        EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
        { subject: 'Custom subject' },
      ),
    ).rejects.toThrow();
  });
});

describe('partial updates — omission leaves a field untouched, explicit null clears it', () => {
  it('preserves subject when a later update omits the field', async () => {
    const { id: tenantId } = await insertTestTenant(db);
    await upsertEmailTemplate(tenantId, EMAIL_TEMPLATE_TYPE.MAGIC_LINK, {
      subject: 'Custom sign-in subject',
    });

    const result = await upsertEmailTemplate(
      tenantId,
      EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
      { logoAssetUrl: 'https://blob.example.com/logo.png' },
    );

    expect(result.subject).toBe('Custom sign-in subject');
  });

  it('clears an authored subject back to the default when explicitly set to null', async () => {
    const { id: tenantId } = await insertTestTenant(db);
    await upsertEmailTemplate(tenantId, EMAIL_TEMPLATE_TYPE.MAGIC_LINK, {
      subject: 'Custom sign-in subject',
    });

    const result = await upsertEmailTemplate(
      tenantId,
      EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
      { subject: null },
    );

    expect(result.subject).toBe(EMAIL_TEMPLATE_DEFAULT_COPY.MAGIC_LINK.subject);
  });
});
