import { EMAIL_TEMPLATE_TYPE, LOCALE_ISO_CODES } from '@blog/config/constants';
import { EMAIL_TEMPLATE_DEFAULT_COPY } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import {
  MOCK_CUSTOM_SUBJECT,
  MOCK_ENGLISH_SUBJECT,
  MOCK_FRENCH_SUBJECT,
  MOCK_GERMAN_SUBJECT,
  MOCK_LOGO_URL,
  MOCK_SECOND_SUBJECT,
} from '@blog/db/testing/email-templates/fixtures';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { MOCK_MISSING_TENANT_ID } from '@blog/db/testing/tenants/fixtures';
import { faker } from '@faker-js/faker';

import { upsertEmailTemplate } from './upsert-email-template';

vi.mock('@blog/db/client');

faker.seed(61014);

const MOCK_OVERLONG_SUBJECT = faker.string.alpha(201);
const MOCK_MALFORMED_BLOCK = { text: faker.lorem.sentence() };

const db = useQueryTestDb();

afterEach(async () => {
  await db().delete(schema.emailTemplates);
  await db().delete(schema.emailTemplateLogos);
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
      { subject: MOCK_CUSTOM_SUBJECT },
    );

    expect(result.subject).toBe(MOCK_CUSTOM_SUBJECT);
    expect(result.body).toEqual(EMAIL_TEMPLATE_DEFAULT_COPY.MAGIC_LINK.body);
  });

  it('updates the existing row, leaving one row per type and language', async () => {
    await upsertEmailTemplate(tenantId, EMAIL_TEMPLATE_TYPE.MAGIC_LINK, {
      subject: MOCK_CUSTOM_SUBJECT,
    });

    const result = await upsertEmailTemplate(
      tenantId,
      EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
      { subject: MOCK_SECOND_SUBJECT },
    );

    const rows = await db().select().from(schema.emailTemplates);
    expect(result.subject).toBe(MOCK_SECOND_SUBJECT);
    expect(rows).toHaveLength(1);
  });

  it('writes only the requested language', async () => {
    await upsertEmailTemplate(
      tenantId,
      EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
      { subject: MOCK_FRENCH_SUBJECT },
      LOCALE_ISO_CODES.FR,
    );

    const english = await upsertEmailTemplate(
      tenantId,
      EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
      { subject: MOCK_ENGLISH_SUBJECT },
      LOCALE_ISO_CODES.EN,
    );

    const rows = await db()
      .select({
        locale: schema.emailTemplates.locale,
        subject: schema.emailTemplates.subject,
      })
      .from(schema.emailTemplates)
      .orderBy(schema.emailTemplates.locale);
    expect(english.subject).toBe(MOCK_ENGLISH_SUBJECT);
    expect(rows).toEqual([
      { locale: LOCALE_ISO_CODES.EN, subject: MOCK_ENGLISH_SUBJECT },
      { locale: LOCALE_ISO_CODES.FR, subject: MOCK_FRENCH_SUBJECT },
    ]);
  });

  it("writes the tenant's default language when no language is given", async () => {
    const { id: germanTenantId } = await insertTestTenant(db(), {
      locale: LOCALE_ISO_CODES.DE,
    });

    await upsertEmailTemplate(germanTenantId, EMAIL_TEMPLATE_TYPE.MAGIC_LINK, {
      subject: MOCK_GERMAN_SUBJECT,
    });

    const [row] = await db().select().from(schema.emailTemplates);
    expect(row?.locale).toBe(LOCALE_ISO_CODES.DE);
  });

  it('rejects a subject longer than its cap', async () => {
    await expect(
      upsertEmailTemplate(tenantId, EMAIL_TEMPLATE_TYPE.MAGIC_LINK, {
        subject: MOCK_OVERLONG_SUBJECT,
      }),
    ).rejects.toThrow();
  });

  it('rejects a body block missing _type or _key', async () => {
    await expect(
      upsertEmailTemplate(tenantId, EMAIL_TEMPLATE_TYPE.MAGIC_LINK, {
        body: [MOCK_MALFORMED_BLOCK as never],
      }),
    ).rejects.toThrow();
  });

  it('rejects a tenantId with no matching tenants row', async () => {
    await expect(
      upsertEmailTemplate(
        MOCK_MISSING_TENANT_ID,
        EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
        { subject: MOCK_CUSTOM_SUBJECT },
      ),
    ).rejects.toThrow();
  });
});

describe('partial updates', () => {
  let tenantId: string;

  beforeEach(async () => {
    ({ id: tenantId } = await insertTestTenant(db()));
    await upsertEmailTemplate(tenantId, EMAIL_TEMPLATE_TYPE.MAGIC_LINK, {
      subject: MOCK_CUSTOM_SUBJECT,
    });
  });

  it('preserves subject when a later update omits the field', async () => {
    const result = await upsertEmailTemplate(
      tenantId,
      EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
      { logoAssetUrl: MOCK_LOGO_URL },
    );

    expect(result.subject).toBe(MOCK_CUSTOM_SUBJECT);
  });

  it('restores the default subject when explicitly set to null', async () => {
    const result = await upsertEmailTemplate(
      tenantId,
      EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
      { subject: null },
    );

    expect(result.subject).toBe(EMAIL_TEMPLATE_DEFAULT_COPY.MAGIC_LINK.subject);
  });
});

describe('logo override', () => {
  let tenantId: string;

  beforeEach(async () => {
    ({ id: tenantId } = await insertTestTenant(db()));
    await upsertEmailTemplate(
      tenantId,
      EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
      { logoAssetUrl: MOCK_LOGO_URL },
      LOCALE_ISO_CODES.FR,
    );
  });

  it('applies a logo written in one language to every language', async () => {
    const result = await upsertEmailTemplate(
      tenantId,
      EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
      { subject: MOCK_ENGLISH_SUBJECT },
      LOCALE_ISO_CODES.EN,
    );

    expect(result.logoAssetUrl).toBe(MOCK_LOGO_URL);
  });

  it('removes the override when the logo is set to null', async () => {
    const result = await upsertEmailTemplate(
      tenantId,
      EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
      { logoAssetUrl: null },
    );

    const logos = await db().select().from(schema.emailTemplateLogos);
    expect(result.logoAssetUrl).toBeUndefined();
    expect(logos).toEqual([]);
  });

  it('creates no per-language row when only the logo changes', async () => {
    const rows = await db().select().from(schema.emailTemplates);

    expect(rows).toEqual([]);
  });
});
