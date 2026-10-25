import { EMAIL_TEMPLATE_TYPE, LOCALE_ISO_CODES } from '@blog/config/constants';
import { EMAIL_TEMPLATE_DEFAULT_COPY } from '@blog/db/constants';
import { createEmptyTestDb } from '@blog/db/testing/create-test-db';
import {
  applyMigrationFile,
  listMigrationFiles,
  MIGRATION_REPLAY_TEST_TIMEOUT_MS,
} from '@blog/db/testing/migration-files';
import { sql } from 'drizzle-orm';

import { emailTemplateLogos, emailTemplates } from './email-templates';

const CUSTOM_SUBJECT = 'Eigener Betreff';
const MAGIC_LINK_LOGO_URL = 'https://blob.example.com/magic-link.png';
const LOCALE_MIGRATION = '0035_massive_lucky_pierre.sql';

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
        text: 'Eigener Text.',
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
  const migrationFiles = listMigrationFiles();

  for (const file of migrationFiles.filter((f) => f < LOCALE_MIGRATION)) {
    await applyMigrationFile(db, file);
  }

  const [tenant] = await db
    .execute<{ id: string }>(
      sql`insert into "tenants" ("name", "primary_domain", "locale", "plan", "status") values ('Tenant', 't.example.com', ${LOCALE_ISO_CODES.DE}, 'FREE', 'ACTIVE') returning "id"`,
    )
    .then((result) => result.rows);

  for (const { templateType, subject, body, logoAssetUrl } of legacyRows) {
    await db.execute(
      sql`insert into "email_templates" ("tenant_id", "template_type", "subject", "body", "logo_asset_url") values (${tenant?.id}, ${templateType}, ${subject}, ${JSON.stringify(body)}::jsonb, ${logoAssetUrl ?? null})`,
    );
  }

  for (const file of migrationFiles.filter((f) => f >= LOCALE_MIGRATION)) {
    await applyMigrationFile(db, file);
  }

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

describe('0035_massive_lucky_pierre + 0036_gifted_kang (email templates per language)', () => {
  it(
    "clears seeded defaults and keeps edited copy under the tenant's default language",
    async () => {
      const { templates } = await migrateGermanTenantTemplates([
        {
          templateType: EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
          subject: CUSTOM_SUBJECT,
          body: EMAIL_TEMPLATE_DEFAULT_COPY.MAGIC_LINK.body,
        },
        {
          templateType: EMAIL_TEMPLATE_TYPE.NEWSLETTER_CONFIRMATION,
          subject: EMAIL_TEMPLATE_DEFAULT_COPY.NEWSLETTER_CONFIRMATION.subject,
          body: customBody,
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
          subject: CUSTOM_SUBJECT,
          body: null,
        },
        {
          templateType: EMAIL_TEMPLATE_TYPE.NEWSLETTER_CONFIRMATION,
          locale: LOCALE_ISO_CODES.DE,
          subject: null,
          body: customBody,
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
          subject: CUSTOM_SUBJECT,
          body: customBody,
          logoAssetUrl: MAGIC_LINK_LOGO_URL,
        },
        {
          templateType: EMAIL_TEMPLATE_TYPE.TENANT_INVITE,
          subject: 'Einladung',
          body: customBody,
        },
      ]);

      expect(logos).toEqual([
        {
          templateType: EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
          logoAssetUrl: MAGIC_LINK_LOGO_URL,
        },
      ]);
    },
    MIGRATION_REPLAY_TEST_TIMEOUT_MS,
  );
});
