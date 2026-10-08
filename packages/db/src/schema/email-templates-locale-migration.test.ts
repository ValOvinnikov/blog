import { EMAIL_TEMPLATE_TYPE, LOCALE_ISO_CODES } from '@blog/config/constants';
import { EMAIL_TEMPLATE_DEFAULT_COPY } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import {
  applyMigrationFile,
  listMigrationFiles,
  MIGRATION_REPLAY_TEST_TIMEOUT_MS,
} from '@blog/db/testing/migration-files';
import { PGlite } from '@electric-sql/pglite';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/pglite';

import { emailTemplates } from './email-templates';

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
  templates: { templateType: string; subject: string; body: unknown }[],
) {
  const client = new PGlite();
  const db = drizzle(client, { schema });
  const migrationFiles = listMigrationFiles();

  for (const file of migrationFiles.filter((f) => f < LOCALE_MIGRATION)) {
    await applyMigrationFile(db, file);
  }

  const [tenant] = await db
    .execute<{ id: string }>(
      sql`insert into "tenants" ("name", "primary_domain", "locale", "plan", "status") values ('Tenant', 't.example.com', ${LOCALE_ISO_CODES.DE}, 'FREE', 'ACTIVE') returning "id"`,
    )
    .then((result) => result.rows);

  for (const { templateType, subject, body } of templates) {
    await db.execute(
      sql`insert into "email_templates" ("tenant_id", "template_type", "subject", "body", "logo_asset_url") values (${tenant?.id}, ${templateType}, ${subject}, ${JSON.stringify(body)}::jsonb, 'https://blob.example.com/logo.png')`,
    );
  }

  for (const file of migrationFiles.filter((f) => f >= LOCALE_MIGRATION)) {
    await applyMigrationFile(db, file);
  }

  return db
    .select({
      templateType: emailTemplates.templateType,
      locale: emailTemplates.locale,
      subject: emailTemplates.subject,
      body: emailTemplates.body,
      logoAssetUrl: emailTemplates.logoAssetUrl,
    })
    .from(emailTemplates)
    .orderBy(emailTemplates.templateType);
}

describe('0035_massive_lucky_pierre (email templates per language)', () => {
  it(
    "clears seeded defaults and keeps edited copy under the tenant's default language",
    async () => {
      const rows = await migrateGermanTenantTemplates([
        {
          templateType: EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
          subject: 'Eigener Betreff',
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

      expect(rows).toEqual([
        {
          templateType: EMAIL_TEMPLATE_TYPE.MAGIC_LINK,
          locale: LOCALE_ISO_CODES.DE,
          subject: 'Eigener Betreff',
          body: null,
          logoAssetUrl: 'https://blob.example.com/logo.png',
        },
        {
          templateType: EMAIL_TEMPLATE_TYPE.NEWSLETTER_CONFIRMATION,
          locale: LOCALE_ISO_CODES.DE,
          subject: null,
          body: customBody,
          logoAssetUrl: 'https://blob.example.com/logo.png',
        },
        {
          templateType: EMAIL_TEMPLATE_TYPE.TENANT_INVITE,
          locale: LOCALE_ISO_CODES.DE,
          subject: null,
          body: null,
          logoAssetUrl: 'https://blob.example.com/logo.png',
        },
      ]);
    },
    MIGRATION_REPLAY_TEST_TIMEOUT_MS,
  );
});
