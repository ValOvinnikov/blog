import { EMAIL_TEMPLATE_TYPE, LOCALE_ISO_CODES } from '@blog/config/constants';
import { EMAIL_TEMPLATE_DEFAULT_COPY } from '@blog/db/constants';
import { createEmptyTestDb } from '@blog/db/testing/create-test-db';
import {
  insertReplayTenant,
  MIGRATION_REPLAY_TEST_TIMEOUT_MS,
  replayMigrationsAround,
} from '@blog/db/testing/migration-files';
import { faker } from '@faker-js/faker';
import { sql } from 'drizzle-orm';

import { emailTemplateLogos, emailTemplates } from './email-templates';

faker.seed(6023);

const LOCALE_MIGRATION = '0035_massive_lucky_pierre.sql';
const MOCK_CUSTOM_SUBJECT = faker.lorem.words(2);
const MOCK_INVITE_SUBJECT = faker.lorem.words(2);
const MOCK_MAGIC_LINK_LOGO_URL = faker.internet.url();
const MOCK_CUSTOM_BODY = [
  {
    _type: 'block',
    _key: faker.string.alphanumeric(8),
    style: 'normal',
    markDefs: [],
    children: [
      {
        _type: 'span',
        _key: faker.string.alphanumeric(8),
        text: faker.lorem.sentence(),
        marks: [],
      },
    ],
  },
];

async function migrateGermanTenantTemplates(
  legacyRows: {
    templateType: string;
    subject: string;
    body: unknown;
    logoAssetUrl?: string;
  }[],
) {
  const db = await createEmptyTestDb();

  await replayMigrationsAround(db, LOCALE_MIGRATION, async () => {
    const tenant = await insertReplayTenant(db, LOCALE_ISO_CODES.DE);

    for (const { templateType, subject, body, logoAssetUrl } of legacyRows) {
      await db.execute(
        sql`insert into "email_templates" ("tenant_id", "template_type", "subject", "body", "logo_asset_url") values (${tenant.id}, ${templateType}, ${subject}, ${JSON.stringify(body)}::jsonb, ${logoAssetUrl ?? null})`,
      );
    }
  });

  const templates = await db
    .select({
      templateType: emailTemplates.templateType,
      locale: emailTemplates.locale,
      subject: emailTemplates.subject,
      body: emailTemplates.body,
    })
    .from(emailTemplates)
    .orderBy(emailTemplates.templateType);
  const logos = await db
    .select({
      templateType: emailTemplateLogos.templateType,
      logoAssetUrl: emailTemplateLogos.logoAssetUrl,
    })
    .from(emailTemplateLogos)
    .orderBy(emailTemplateLogos.templateType);

  return { templates, logos };
}

describe(`${LOCALE_MIGRATION} (email templates per language)`, () => {
  it(
    "clears seeded defaults and keeps edited copy under the tenant's default language",
    async () => {
      const { templates } = await migrateGermanTenantTemplates([
        {
          templateType: EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
          subject: MOCK_CUSTOM_SUBJECT,
          body: EMAIL_TEMPLATE_DEFAULT_COPY.MAGIC_LINK.body,
        },
        {
          templateType: EMAIL_TEMPLATE_TYPE.NEWSLETTER_CONFIRMATION,
          subject: EMAIL_TEMPLATE_DEFAULT_COPY.NEWSLETTER_CONFIRMATION.subject,
          body: MOCK_CUSTOM_BODY,
        },
        {
          templateType: EMAIL_TEMPLATE_TYPE.TENANT_INVITE,
          subject: EMAIL_TEMPLATE_DEFAULT_COPY.TENANT_INVITE.subject,
          body: EMAIL_TEMPLATE_DEFAULT_COPY.TENANT_INVITE.body,
        },
      ]);

      expect(templates).toEqual([
        {
          templateType: EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
          locale: LOCALE_ISO_CODES.DE,
          subject: MOCK_CUSTOM_SUBJECT,
          body: null,
        },
        {
          templateType: EMAIL_TEMPLATE_TYPE.NEWSLETTER_CONFIRMATION,
          locale: LOCALE_ISO_CODES.DE,
          subject: null,
          body: MOCK_CUSTOM_BODY,
        },
        {
          templateType: EMAIL_TEMPLATE_TYPE.TENANT_INVITE,
          locale: LOCALE_ISO_CODES.DE,
          subject: null,
          body: null,
        },
      ]);
    },
    MIGRATION_REPLAY_TEST_TIMEOUT_MS,
  );

  it(
    "moves each template's logo override out of the per-language rows",
    async () => {
      const { logos } = await migrateGermanTenantTemplates([
        {
          templateType: EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
          subject: MOCK_CUSTOM_SUBJECT,
          body: MOCK_CUSTOM_BODY,
          logoAssetUrl: MOCK_MAGIC_LINK_LOGO_URL,
        },
        {
          templateType: EMAIL_TEMPLATE_TYPE.TENANT_INVITE,
          subject: MOCK_INVITE_SUBJECT,
          body: MOCK_CUSTOM_BODY,
        },
      ]);

      expect(logos).toEqual([
        {
          templateType: EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
          logoAssetUrl: MOCK_MAGIC_LINK_LOGO_URL,
        },
      ]);
    },
    MIGRATION_REPLAY_TEST_TIMEOUT_MS,
  );
});
