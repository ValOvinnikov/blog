import { EMAIL_TEMPLATE_TYPE } from '@blog/config/constants';
import { EMAIL_TEMPLATE_DEFAULT_COPY } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { createTestDb } from '@blog/db/testing/create-test-db';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { and, eq } from 'drizzle-orm';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

import { seedEmailTemplateDefaults } from './seed-email-template-defaults';

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

describe(seedEmailTemplateDefaults, () => {
  it('inserts one row per template type with the product default copy', async () => {
    const { id: tenantId } = await insertTestTenant(db);

    await seedEmailTemplateDefaults(tenantId);

    const rows = await db
      .select()
      .from(schema.emailTemplates)
      .where(eq(schema.emailTemplates.tenantId, tenantId));

    expect(rows.map((row) => row.templateType).sort()).toEqual(
      Object.values(EMAIL_TEMPLATE_TYPE).sort(),
    );
    for (const row of rows) {
      expect(row.subject).toBe(
        EMAIL_TEMPLATE_DEFAULT_COPY[row.templateType].subject,
      );
      expect(row.body).toEqual(
        EMAIL_TEMPLATE_DEFAULT_COPY[row.templateType].body,
      );
    }
  });

  it('never overwrites a row that already has authored copy', async () => {
    const { id: tenantId } = await insertTestTenant(db);
    await db.insert(schema.emailTemplates).values({
      tenantId,
      templateType: EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
      subject: 'Already customized subject',
    });

    await seedEmailTemplateDefaults(tenantId);

    const [row] = await db
      .select()
      .from(schema.emailTemplates)
      .where(
        and(
          eq(schema.emailTemplates.tenantId, tenantId),
          eq(
            schema.emailTemplates.templateType,
            EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
          ),
        ),
      );

    expect(row?.subject).toBe('Already customized subject');
  });

  it('is idempotent — a second call is a no-op', async () => {
    const { id: tenantId } = await insertTestTenant(db);
    await seedEmailTemplateDefaults(tenantId);

    await seedEmailTemplateDefaults(tenantId);

    const rows = await db
      .select()
      .from(schema.emailTemplates)
      .where(eq(schema.emailTemplates.tenantId, tenantId));
    expect(rows).toHaveLength(Object.values(EMAIL_TEMPLATE_TYPE).length);
  });
});
