import {
  AUDIT_ACTION,
  AUDIT_TARGET_TYPE,
  FINDING_KIND,
  FINDING_SEVERITY,
  FINDING_SOURCE,
  FINDING_STATUS,
} from '@blog/config/constants';
import * as schema from '@blog/db/schema';
import { auditEvents } from '@blog/db/schema/audit-events';
import { findings } from '@blog/db/schema/findings';
import { MOCK_OPERATOR_EMAIL } from '@blog/db/testing/fixtures';
import {
  applyMigrationFile,
  listMigrationFiles,
  MIGRATION_REPLAY_TEST_TIMEOUT_MS,
  insertReplayTenant,
} from '@blog/db/testing/migration-files';
import { PGlite } from '@electric-sql/pglite';
import { faker } from '@faker-js/faker';
import { eq } from 'drizzle-orm';
import { drizzle, type PgliteDatabase } from 'drizzle-orm/pglite';

const SCRUB_MIGRATION = '0053_scrub_emails_from_audit_and_findings_details.sql';
const ACTOR_ID = 'operator-1';
const OWNER_EMAIL = 'owner@acme.example';
const TENANT_NAME = faker.company.name();
const TENANT_DOMAIN = faker.internet.domainName();
const SENDER_NAME = 'Acme Co';
const EMAIL_REMOVED = '[email removed]';

async function migrateUpToScrub(db: PgliteDatabase<typeof schema>) {
  for (const file of listMigrationFiles()) {
    if (file >= SCRUB_MIGRATION) break;
    await applyMigrationFile(db, file);
  }
}

async function insertAuditEvent(
  db: PgliteDatabase<typeof schema>,
  values: Pick<
    typeof auditEvents.$inferInsert,
    'action' | 'targetType' | 'targetId' | 'details'
  >,
) {
  const [inserted] = await db
    .insert(auditEvents)
    .values({ actorId: ACTOR_ID, actorEmail: MOCK_OPERATOR_EMAIL, ...values })
    .returning();
  if (!inserted) throw new Error('failed to seed an audit event');
  return inserted;
}

async function readAuditEvent(db: PgliteDatabase<typeof schema>, id: string) {
  const [row] = await db
    .select()
    .from(auditEvents)
    .where(eq(auditEvents.id, id));
  return row;
}

describe('0053_scrub_emails_from_audit_and_findings_details', () => {
  let db: PgliteDatabase<typeof schema>;
  let tenant: Awaited<ReturnType<typeof insertReplayTenant>>;

  beforeEach(async () => {
    db = drizzle(new PGlite(), { schema });
    await migrateUpToScrub(db);
    tenant = await insertReplayTenant(db);
  }, MIGRATION_REPLAY_TEST_TIMEOUT_MS);

  it(
    'drops the owner email from a tenant creation event and keeps the event itself',
    async () => {
      const created = await insertAuditEvent(db, {
        action: AUDIT_ACTION.CREATED,
        targetType: AUDIT_TARGET_TYPE.TENANT,
        targetId: tenant.id,
        details: {
          name: TENANT_NAME,
          domain: TENANT_DOMAIN,
          ownerEmail: OWNER_EMAIL,
        },
      });

      await applyMigrationFile(db, SCRUB_MIGRATION);

      expect(await readAuditEvent(db, created.id)).toEqual({
        ...created,
        details: { name: TENANT_NAME, domain: TENANT_DOMAIN },
      });
    },
    MIGRATION_REPLAY_TEST_TIMEOUT_MS,
  );

  it(
    'records that a tenant details save changed the owner email, without the address',
    async () => {
      const updated = await insertAuditEvent(db, {
        action: AUDIT_ACTION.SETTINGS_UPDATED,
        targetType: AUDIT_TARGET_TYPE.TENANT,
        targetId: tenant.id,
        details: { name: TENANT_NAME, ownerEmail: OWNER_EMAIL },
      });

      await applyMigrationFile(db, SCRUB_MIGRATION);

      expect((await readAuditEvent(db, updated.id))?.details).toEqual({
        name: TENANT_NAME,
        ownerEmailUpdated: true,
      });
    },
    MIGRATION_REPLAY_TEST_TIMEOUT_MS,
  );

  it(
    'replaces an email config save with the names of the fields it wrote',
    async () => {
      const saved = await insertAuditEvent(db, {
        action: AUDIT_ACTION.SETTINGS_UPDATED,
        targetType: AUDIT_TARGET_TYPE.SITE_CONFIG,
        targetId: tenant.id,
        details: {
          senderName: SENDER_NAME,
          replyToAddress: faker.internet.email(),
          contactRecipient: faker.internet.email(),
          footerPostalAddress: null,
        },
      });

      await applyMigrationFile(db, SCRUB_MIGRATION);

      const { fields, ...rest } =
        (await readAuditEvent(db, saved.id))?.details ?? {};
      expect(rest).toEqual({});
      expect(Array.isArray(fields) && [...fields].sort()).toEqual([
        'contactRecipient',
        'replyToAddress',
        'senderName',
      ]);
    },
    MIGRATION_REPLAY_TEST_TIMEOUT_MS,
  );

  it(
    'removes email-valued keys and masks addresses inside longer text in findings',
    async () => {
      const [finding] = await db
        .insert(findings)
        .values({
          tenantId: tenant.id,
          source: FINDING_SOURCE.DOCUMENT_VALIDATION,
          kind: FINDING_KIND.SCHEMA_VALIDATION_ERROR,
          severity: FINDING_SEVERITY.WARNING,
          status: FINDING_STATUS.OPEN,
          dedupeKey: faker.string.uuid(),
          details: {
            invalidDocumentCount: 1,
            contact: OWNER_EMAIL,
            documents: [{ message: `Write to ${OWNER_EMAIL} for help` }],
          },
        })
        .returning();
      if (!finding) throw new Error('failed to seed a finding');

      await applyMigrationFile(db, SCRUB_MIGRATION);

      const [row] = await db
        .select({ details: findings.details })
        .from(findings)
        .where(eq(findings.id, finding.id));
      expect(row?.details).toEqual({
        invalidDocumentCount: 1,
        documents: [{ message: `Write to ${EMAIL_REMOVED} for help` }],
      });
    },
    MIGRATION_REPLAY_TEST_TIMEOUT_MS,
  );

  it(
    'changes nothing when it runs a second time',
    async () => {
      await insertAuditEvent(db, {
        action: AUDIT_ACTION.SETTINGS_UPDATED,
        targetType: AUDIT_TARGET_TYPE.TENANT,
        targetId: tenant.id,
        details: { ownerEmail: OWNER_EMAIL },
      });
      await insertAuditEvent(db, {
        action: AUDIT_ACTION.SETTINGS_UPDATED,
        targetType: AUDIT_TARGET_TYPE.SITE_CONFIG,
        targetId: tenant.id,
        details: { senderName: SENDER_NAME, replyToAddress: OWNER_EMAIL },
      });

      await applyMigrationFile(db, SCRUB_MIGRATION);
      const once = await db.select().from(auditEvents);
      await applyMigrationFile(db, SCRUB_MIGRATION);

      expect(await db.select().from(auditEvents)).toEqual(once);
    },
    MIGRATION_REPLAY_TEST_TIMEOUT_MS,
  );
});
