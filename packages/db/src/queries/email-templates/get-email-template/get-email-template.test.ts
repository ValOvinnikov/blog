import { EMAIL_TEMPLATE_TYPE, LOCALE_ISO_CODES } from '@blog/config/constants';
import {
  EMAIL_TEMPLATE_DEFAULT_COPY,
  EMAIL_TEMPLATE_DEFAULT_COPY_BY_LOCALE,
} from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';

import { getEmailTemplate } from './get-email-template';

vi.mock('@blog/db/client');

const MOCK_CUSTOM_SUBJECT = 'Custom sign-in subject';
const MOCK_NEWSLETTER_LOGO_URL = 'https://blob.example.com/newsletter-logo.png';
const MOCK_GERMAN_SUBJECT = 'Deutscher Betreff';
const MOCK_FRENCH_SUBJECT = 'Sujet français';
const MOCK_LOGO_URL = 'https://blob.example.com/logo.png';

const db = useQueryTestDb();

afterEach(async () => {
  await db().delete(schema.emailTemplates);
  await db().delete(schema.tenants);
});

describe(getEmailTemplate, () => {
  let tenantId: string;

  beforeEach(async () => {
    ({ id: tenantId } = await insertTestTenant(db()));
  });

  it('returns full product defaults when no row exists for the template type', async () => {
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
    const customBody = [
      {
        _type: 'block',
        _key: 'custom-1',
        style: 'normal',
        markDefs: [],
        children: [
          {
            _type: 'span',
            _key: 'custom-1-span',
            text: 'Custom body.',
            marks: [],
          },
        ],
      },
    ];
    await db().insert(schema.emailTemplates).values({
      tenantId,
      templateType: EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
      locale: LOCALE_ISO_CODES.EN,
      body: customBody,
    });

    const result = await getEmailTemplate(
      tenantId,
      EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
    );

    expect(result.subject).toBe(EMAIL_TEMPLATE_DEFAULT_COPY.MAGIC_LINK.subject);
    expect(result.body).toEqual(customBody);
  });

  it('returns the authored logoAssetUrl when set, and undefined when not', async () => {
    await db().insert(schema.emailTemplateLogos).values({
      tenantId,
      templateType: EMAIL_TEMPLATE_TYPE.NEWSLETTER_CONFIRMATION,
      logoAssetUrl: MOCK_NEWSLETTER_LOGO_URL,
    });

    const result = await getEmailTemplate(
      tenantId,
      EMAIL_TEMPLATE_TYPE.NEWSLETTER_CONFIRMATION,
    );

    expect(result.logoAssetUrl).toBe(MOCK_NEWSLETTER_LOGO_URL);

    const other = await getEmailTemplate(
      tenantId,
      EMAIL_TEMPLATE_TYPE.TENANT_INVITE,
    );
    expect(other.logoAssetUrl).toBeUndefined();
  });
});

describe('per-language fallback', () => {
  let tenantId: string;

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

  it("falls back to the tenant's default language when the requested one has none", async () => {
    const result = await getEmailTemplate(
      tenantId,
      EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
      LOCALE_ISO_CODES.ES,
    );

    expect(result.subject).toBe(MOCK_GERMAN_SUBJECT);
  });

  it('falls back to the product default in the requested language when neither has the field', async () => {
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
