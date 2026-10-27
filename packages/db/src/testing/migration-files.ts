import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  DENSITY,
  FONT_CHOICE,
  LOCALE_ISO_CODES,
  PRESET_ID,
  RADIUS_SCALE,
} from '@blog/config/constants';
import type { TMaybeNull } from '@blog/config/types';
import type { TDb } from '@blog/db/client';
import { TENANT_PLAN, TENANT_STATUS } from '@blog/db/constants';
import type * as schema from '@blog/db/schema';
import { siteConfig } from '@blog/db/schema/site-config';
import { faker } from '@faker-js/faker';
import { eq, sql } from 'drizzle-orm';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

const MIGRATION_REPLAY_FAKER_SEED = 6023;

faker.seed(MIGRATION_REPLAY_FAKER_SEED);

const migrationsDir = fileURLToPath(
  new URL('../../migrations', import.meta.url),
);

// Replaying every migration on a machine under heavy concurrent load far outlasts Vitest's default timeouts.
export const MIGRATION_REPLAY_TEST_TIMEOUT_MS = 120_000;

// pglite (Postgres compiled to WASM) doesn't ship the `pgvector` extension,
// so the bootstrap migration that turns it on for a future embeddings
// column can't run here. No feature table depends on it yet, so it's safe to
// skip — every real migration after it still applies in full, against a
// genuine Postgres engine.
const SKIPPED_MIGRATIONS = new Set(['0000_enable_pgvector_extension.sql']);

export function listMigrationFiles(): string[] {
  return readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql') && !SKIPPED_MIGRATIONS.has(file))
    .sort();
}

export async function applyMigrationFile(db: TDb, file: string): Promise<void> {
  const migrationSql = readFileSync(join(migrationsDir, file), 'utf-8');
  const statements = migrationSql
    .split('--> statement-breakpoint')
    .map((statement) => statement.trim())
    .filter((statement) => statement.length > 0);

  for (const statement of statements) {
    await db.execute(sql.raw(statement));
  }
}

async function applyMigrationFiles(db: TDb, files: string[]): Promise<void> {
  for (const file of files) {
    await applyMigrationFile(db, file);
  }
}

export function applyMigrationsBefore(db: TDb, file: string): Promise<void> {
  return applyMigrationFiles(
    db,
    listMigrationFiles().filter((name) => name < file),
  );
}

function applyMigrationsFrom(db: TDb, file: string): Promise<void> {
  return applyMigrationFiles(
    db,
    listMigrationFiles().filter((name) => name >= file),
  );
}

export function applyMigrationsExcept(db: TDb, file: string): Promise<void> {
  return applyMigrationFiles(
    db,
    listMigrationFiles().filter((name) => name !== file),
  );
}

export async function replayMigrationsAround(
  db: TDb,
  file: string,
  seed: () => Promise<void>,
): Promise<void> {
  await applyMigrationsBefore(db, file);
  await seed();
  await applyMigrationsFrom(db, file);
}

// Raw SQL rather than `insertTestTenant`: the current `tenants` schema names columns a part-migrated database lacks.
export async function insertReplayTenant(
  db: PgliteDatabase<typeof schema>,
  locale: string = LOCALE_ISO_CODES.EN,
): Promise<{ id: string }> {
  const key = `tenant-${crypto.randomUUID()}`;
  const { rows } = await db.execute<{ id: string }>(
    sql`insert into "tenants" ("name", "primary_domain", "locale", "plan", "status") values (${key}, ${`${key}.example.com`}, ${locale}, ${TENANT_PLAN.FREE}, ${TENANT_STATUS.ACTIVE}) returning "id"`,
  );
  const [tenant] = rows;
  if (!tenant) throw new Error('insertReplayTenant: insert returned no row.');
  return tenant;
}

// Before the `name` column existed, a tenant was identified by `slug` and its Sanity project.
export async function insertReplayLegacyTenant(
  db: PgliteDatabase<typeof schema>,
  slug: string,
): Promise<{ id: string; primaryDomain: string }> {
  const primaryDomain = `${slug}.example.com`;
  const { rows } = await db.execute<{ id: string }>(
    sql`insert into "tenants" ("slug", "primary_domain", "sanity_project_id", "sanity_dataset", "locale", "plan", "status") values (${slug}, ${primaryDomain}, ${faker.string.alphanumeric(8)}, ${faker.word.noun()}, ${LOCALE_ISO_CODES.EN}, ${TENANT_PLAN.FREE}, ${TENANT_STATUS.ACTIVE}) returning "id"`,
  );
  const [tenant] = rows;
  if (!tenant) {
    throw new Error('insertReplayLegacyTenant: insert returned no row.');
  }
  return { id: tenant.id, primaryDomain };
}

export async function insertReplayUser(
  db: PgliteDatabase<typeof schema>,
): Promise<{ id: string }> {
  const id = faker.string.uuid();
  await db.execute(sql`insert into "users" ("id") values (${id})`);
  return { id };
}

export async function insertReplaySubscriber(
  db: PgliteDatabase<typeof schema>,
  {
    tenantId,
    unsubscribeToken,
  }: { tenantId: string; unsubscribeToken?: TMaybeNull<string> },
): Promise<{ id: string; email: string; confirmationToken: string }> {
  const subscriber = {
    id: faker.string.uuid(),
    email: faker.internet.email(),
    confirmationToken: faker.string.uuid(),
  };
  const hasUnsubscribeToken = unsubscribeToken !== undefined;
  const unsubscribeColumn = hasUnsubscribeToken
    ? sql`, "unsubscribe_token"`
    : sql``;
  const unsubscribeValue = hasUnsubscribeToken
    ? sql`, ${unsubscribeToken}`
    : sql``;
  await db.execute(
    sql`insert into "subscribers" ("id", "tenant_id", "email", "confirmation_token"${unsubscribeColumn}) values (${subscriber.id}, ${tenantId}, ${subscriber.email}, ${subscriber.confirmationToken}${unsubscribeValue})`,
  );
  return subscriber;
}

export async function insertReplayVoiceOverrides(
  db: PgliteDatabase<typeof schema>,
  voiceOverrides: Record<string, unknown>,
  locale: string = LOCALE_ISO_CODES.EN,
): Promise<string> {
  const tenant = await insertReplayTenant(db, locale);
  await db.execute(sql`
    insert into "site_config"
      ("tenant_id", "preset", "accent_hue", "heading_font", "body_font", "radius_scale", "density", "voice_overrides")
    values (
      ${tenant.id}, ${PRESET_ID.EDITORIAL}, ${faker.number.int({ min: 0, max: 360 })}, ${FONT_CHOICE.FRAUNCES}, ${FONT_CHOICE.INTER},
      ${RADIUS_SCALE.SM}, ${DENSITY.COMPACT}, ${JSON.stringify(voiceOverrides)}::jsonb
    )
  `);
  return tenant.id;
}

export async function readReplayVoiceOverrides(
  db: PgliteDatabase<typeof schema>,
  tenantId: string,
) {
  const [row] = await db
    .select({ voiceOverrides: siteConfig.voiceOverridesByLocale })
    .from(siteConfig)
    .where(eq(siteConfig.tenantId, tenantId));
  if (!row) throw new Error('readReplayVoiceOverrides: no site_config row.');
  return row.voiceOverrides;
}
