import { EMAIL_TEMPLATE_TYPE } from '@blog/config/constants';
import * as schema from '@blog/db/schema';
import { createTestDb } from '@blog/db/testing/create-test-db';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

import { listEmailTemplates } from './list-email-templates';

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

describe(listEmailTemplates, () => {
  it('returns one entry per template type, even with no rows at all', async () => {
    const { id: tenantId } = await insertTestTenant(db);

    const result = await listEmailTemplates(tenantId);

    expect(result.map((entry) => entry.templateType).sort()).toEqual(
      Object.values(EMAIL_TEMPLATE_TYPE).sort(),
    );
  });

  it('mixes authored and default entries across template types', async () => {
    const { id: tenantId } = await insertTestTenant(db);
    await db.insert(schema.emailTemplates).values({
      tenantId,
      templateType: EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
      subject: 'Custom sign-in subject',
    });

    const result = await listEmailTemplates(tenantId);

    const magicLink = result.find(
      (entry) => entry.templateType === EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
    );
    const invite = result.find(
      (entry) => entry.templateType === EMAIL_TEMPLATE_TYPE.TENANT_INVITE,
    );

    expect(magicLink?.subject).toBe('Custom sign-in subject');
    expect(invite?.subject).not.toBe('Custom sign-in subject');
  });
});
