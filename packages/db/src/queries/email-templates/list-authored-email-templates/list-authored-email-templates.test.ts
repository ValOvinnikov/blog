import { EMAIL_TEMPLATE_TYPE, LOCALE_ISO_CODES } from '@blog/config/constants';
import * as schema from '@blog/db/schema';
import {
  MOCK_ENGLISH_SUBJECT,
  MOCK_FRENCH_SUBJECT,
  MOCK_SECOND_SUBJECT,
} from '@blog/db/testing/email-templates/fixtures';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';

import { listAuthoredEmailTemplates } from './list-authored-email-templates';

vi.mock('@blog/db/client');

const db = useQueryTestDb();

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
          subject: MOCK_ENGLISH_SUBJECT,
        },
        {
          tenantId,
          templateType: EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
          locale: LOCALE_ISO_CODES.FR,
          subject: MOCK_FRENCH_SUBJECT,
        },
      ]);

    const rows = await listAuthoredEmailTemplates(tenantId);

    const sortedRows = rows.sort((a, b) => a.locale.localeCompare(b.locale));
    expect(sortedRows).toEqual([
      {
        templateType: EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
        locale: LOCALE_ISO_CODES.EN,
        subject: MOCK_ENGLISH_SUBJECT,
        body: null,
      },
      {
        templateType: EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
        locale: LOCALE_ISO_CODES.FR,
        subject: MOCK_FRENCH_SUBJECT,
        body: null,
      },
    ]);
  });

  it("leaves out another tenant's rows", async () => {
    const { id: otherTenantId } = await insertTestTenant(db());
    await db().insert(schema.emailTemplates).values({
      tenantId: otherTenantId,
      templateType: EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
      locale: LOCALE_ISO_CODES.EN,
      subject: MOCK_SECOND_SUBJECT,
    });

    await expect(listAuthoredEmailTemplates(tenantId)).resolves.toEqual([]);
  });
});
