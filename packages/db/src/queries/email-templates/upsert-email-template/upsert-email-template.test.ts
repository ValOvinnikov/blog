import { EMAIL_TEMPLATE_TYPE, LOCALE_ISO_CODES } from '@blog/config/constants';
import { EMAIL_TEMPLATE_DEFAULT_COPY } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';

import { upsertEmailTemplate } from './upsert-email-template';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);

afterEach(async () => {
  await db().delete(schema.emailTemplates);
  await db().delete(schema.tenants);
});

describe(upsertEmailTemplate, () => {
  let tenantId: string;

  beforeEach(async () => {
    ({ id: tenantId } = await insertTestTenant(db()));
  });

  it('inserts a new row with only the provided fields set', async () => {
    const result = await upsertEmailTemplate(
      tenantId,
      EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
      { subject: 'Custom sign-in subject' },
    );

    expect(result.subject).toBe('Custom sign-in subject');
    expect(result.body).toEqual(EMAIL_TEMPLATE_DEFAULT_COPY.MAGIC_LINK.body);
  });

  it('updates the existing row in place rather than inserting a second one', async () => {
    await upsertEmailTemplate(tenantId, EMAIL_TEMPLATE_TYPE.MAGIC_LINK, {
      subject: 'First subject',
    });

    const result = await upsertEmailTemplate(
      tenantId,
      EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
      { subject: 'Second subject' },
    );

    expect(result.subject).toBe('Second subject');
    const rows = await db().select().from(schema.emailTemplates);
    expect(rows).toHaveLength(1);
  });

  it('writes only the requested language', async () => {
    await upsertEmailTemplate(
      tenantId,
      EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
      { subject: 'Sujet français' },
      LOCALE_ISO_CODES.FR,
    );

    const english = await upsertEmailTemplate(
      tenantId,
      EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
      { subject: 'English subject' },
      LOCALE_ISO_CODES.EN,
    );

    expect(english.subject).toBe('English subject');
    const rows = await db()
      .select({
        locale: schema.emailTemplates.locale,
        subject: schema.emailTemplates.subject,
      })
      .from(schema.emailTemplates)
      .orderBy(schema.emailTemplates.locale);
    expect(rows).toEqual([
      { locale: LOCALE_ISO_CODES.EN, subject: 'English subject' },
      { locale: LOCALE_ISO_CODES.FR, subject: 'Sujet français' },
    ]);
  });

  it("writes the tenant's default language when no language is given", async () => {
    const { id: germanTenantId } = await insertTestTenant(db(), {
      locale: LOCALE_ISO_CODES.DE,
    });

    await upsertEmailTemplate(germanTenantId, EMAIL_TEMPLATE_TYPE.MAGIC_LINK, {
      subject: 'Deutscher Betreff',
    });

    const [row] = await db().select().from(schema.emailTemplates);
    expect(row?.locale).toBe(LOCALE_ISO_CODES.DE);
  });

  it('rejects a subject longer than its cap', async () => {
    await expect(
      upsertEmailTemplate(tenantId, EMAIL_TEMPLATE_TYPE.MAGIC_LINK, {
        subject: 'x'.repeat(201),
      }),
    ).rejects.toThrow();
  });

  it('rejects a body block missing _type or _key', async () => {
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
  let tenantId: string;

  beforeEach(async () => {
    ({ id: tenantId } = await insertTestTenant(db()));
  });

  it('preserves subject when a later update omits the field', async () => {
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
