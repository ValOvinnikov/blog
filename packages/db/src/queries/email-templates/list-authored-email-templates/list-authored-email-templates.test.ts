import { EMAIL_TEMPLATE_TYPE, LOCALE_ISO_CODES } from '@blog/config/constants';
import * as schema from '@blog/db/schema';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';

import { listAuthoredEmailTemplates } from './list-authored-email-templates';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);

afterEach(async () => {
  await db().delete(schema.emailTemplates);
  await db().delete(schema.tenants);
});

describe(listAuthoredEmailTemplates, () => {
  let tenantId: string;

  beforeEach(async () => {
    ({ id: tenantId } = await insertTestTenant(db()));
  });

  it('returns nothing for a tenant that has written no copy', async () => {
    await expect(listAuthoredEmailTemplates(tenantId)).resolves.toEqual([]);
  });

  it('returns each language row as written, leaving unwritten fields null', async () => {
    await db()
      .insert(schema.emailTemplates)
      .values([
        {
          tenantId,
          templateType: EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
          locale: LOCALE_ISO_CODES.EN,
          subject: 'Sign in',
        },
        {
          tenantId,
          templateType: EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
          locale: LOCALE_ISO_CODES.FR,
          subject: 'Connexion',
        },
      ]);

    const rows = await listAuthoredEmailTemplates(tenantId);

    expect(rows).toHaveLength(2);
    expect(rows).toEqual(
      expect.arrayContaining([
        {
          templateType: EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
          locale: LOCALE_ISO_CODES.EN,
          subject: 'Sign in',
          body: null,
        },
        {
          templateType: EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
          locale: LOCALE_ISO_CODES.FR,
          subject: 'Connexion',
          body: null,
        },
      ]),
    );
  });

  it("leaves out another tenant's rows", async () => {
    const { id: otherTenantId } = await insertTestTenant(db());
    await db().insert(schema.emailTemplates).values({
      tenantId: otherTenantId,
      templateType: EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
      locale: LOCALE_ISO_CODES.EN,
      subject: 'Not mine',
    });

    await expect(listAuthoredEmailTemplates(tenantId)).resolves.toEqual([]);
  });
});
