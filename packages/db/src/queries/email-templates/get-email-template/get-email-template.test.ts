import { EMAIL_TEMPLATE_TYPE, LOCALE_ISO_CODES } from '@blog/config/constants';
import {
  EMAIL_TEMPLATE_DEFAULT_COPY,
  EMAIL_TEMPLATE_DEFAULT_COPY_BY_LOCALE,
} from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import {
  MOCK_CUSTOM_BODY,
  MOCK_CUSTOM_SUBJECT,
  MOCK_FRENCH_SUBJECT,
  MOCK_GERMAN_SUBJECT,
  MOCK_LOGO_URL,
} from '@blog/db/testing/email-templates/fixtures';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';

import { getEmailTemplate } from './get-email-template';

vi.mock('@blog/db/client');

const db = useQueryTestDb();

afterEach(async () => {
  await db().delete(schema.emailTemplates);
  await db().delete(schema.emailTemplateLogos);
  await db().delete(schema.tenants);
});

describe(getEmailTemplate, () => {
  let tenantId: string;

  beforeEach(async () => {
    ({ id: tenantId } = await insertTestTenant(db()));
  });

  it('returns full product defaults when no row exists for the type', async () => {
    const result = await getEmailTemplate(
      tenantId,
      EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
    );

    expect(result).toEqual({
      tenantId,
      templateType: EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
      subject: EMAIL_TEMPLATE_DEFAULT_COPY.MAGIC_LINK.subject,
      body: EMAIL_TEMPLATE_DEFAULT_COPY.MAGIC_LINK.body,
      logoAssetUrl: undefined,
    });
  });

  it('renders the default body when only the subject has been authored', async () => {
    await db().insert(schema.emailTemplates).values({
      tenantId,
      templateType: EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
      locale: LOCALE_ISO_CODES.EN,
      subject: MOCK_CUSTOM_SUBJECT,
    });

    const result = await getEmailTemplate(
      tenantId,
      EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
    );

    expect(result.subject).toBe(MOCK_CUSTOM_SUBJECT);
    expect(result.body).toEqual(EMAIL_TEMPLATE_DEFAULT_COPY.MAGIC_LINK.body);
  });

  it('renders the default subject when only the body has been authored', async () => {
    await db().insert(schema.emailTemplates).values({
      tenantId,
      templateType: EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
      locale: LOCALE_ISO_CODES.EN,
      body: MOCK_CUSTOM_BODY,
    });

    const result = await getEmailTemplate(
      tenantId,
      EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
    );

    expect(result.subject).toBe(EMAIL_TEMPLATE_DEFAULT_COPY.MAGIC_LINK.subject);
    expect(result.body).toEqual(MOCK_CUSTOM_BODY);
  });

  describe('logo override', () => {
    beforeEach(async () => {
      await db().insert(schema.emailTemplateLogos).values({
        tenantId,
        templateType: EMAIL_TEMPLATE_TYPE.NEWSLETTER_CONFIRMATION,
        logoAssetUrl: MOCK_LOGO_URL,
      });
    });

    it('returns the authored logoAssetUrl for its template type', async () => {
      const result = await getEmailTemplate(
        tenantId,
        EMAIL_TEMPLATE_TYPE.NEWSLETTER_CONFIRMATION,
      );

      expect(result.logoAssetUrl).toBe(MOCK_LOGO_URL);
    });

    it('returns no logoAssetUrl for a template type without one', async () => {
      const result = await getEmailTemplate(
        tenantId,
        EMAIL_TEMPLATE_TYPE.TENANT_INVITE,
      );

      expect(result.logoAssetUrl).toBeUndefined();
    });
  });

  describe('per-language fallback', () => {
    beforeEach(async () => {
      ({ id: tenantId } = await insertTestTenant(db(), {
        locale: LOCALE_ISO_CODES.DE,
        additionalLocales: [LOCALE_ISO_CODES.FR, LOCALE_ISO_CODES.ES],
      }));
      await db()
        .insert(schema.emailTemplates)
        .values([
          {
            tenantId,
            templateType: EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
            locale: LOCALE_ISO_CODES.DE,
            subject: MOCK_GERMAN_SUBJECT,
          },
          {
            tenantId,
            templateType: EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
            locale: LOCALE_ISO_CODES.FR,
            subject: MOCK_FRENCH_SUBJECT,
          },
        ]);
    });

    it('uses the requested language when it has authored copy', async () => {
      const result = await getEmailTemplate(
        tenantId,
        EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
        LOCALE_ISO_CODES.FR,
      );

      expect(result.subject).toBe(MOCK_FRENCH_SUBJECT);
    });

    it("falls back to the tenant's default language when none is authored", async () => {
      const result = await getEmailTemplate(
        tenantId,
        EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
        LOCALE_ISO_CODES.ES,
      );

      expect(result.subject).toBe(MOCK_GERMAN_SUBJECT);
    });

    it('falls back to the product default in the requested language', async () => {
      const result = await getEmailTemplate(
        tenantId,
        EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
        LOCALE_ISO_CODES.ES,
      );

      expect(result.body).toEqual(
        EMAIL_TEMPLATE_DEFAULT_COPY_BY_LOCALE.ES.MAGIC_LINK.body,
      );
    });

    it("reads the tenant's default language when no language is requested", async () => {
      const result = await getEmailTemplate(
        tenantId,
        EMAIL_TEMPLATE_TYPE.TENANT_INVITE,
      );

      expect(result.subject).toBe(
        EMAIL_TEMPLATE_DEFAULT_COPY_BY_LOCALE.DE.TENANT_INVITE.subject,
      );
    });

    it('returns the same logo override in every language', async () => {
      await db().insert(schema.emailTemplateLogos).values({
        tenantId,
        templateType: EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
        logoAssetUrl: MOCK_LOGO_URL,
      });

      const logos = await Promise.all(
        Object.values(LOCALE_ISO_CODES).map(async (locale) => {
          const { logoAssetUrl } = await getEmailTemplate(
            tenantId,
            EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
            locale,
          );
          return logoAssetUrl;
        }),
      );

      expect(new Set(logos)).toEqual(new Set([MOCK_LOGO_URL]));
    });
  });
});
