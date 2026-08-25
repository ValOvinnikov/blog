import {
  DENSITY,
  FONT_CHOICE,
  PRESET_ID,
  RADIUS_SCALE,
} from '@blog/config/constants';
import { TENANT_PLAN, TENANT_STATUS } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import {
  applyMigrationFile,
  listMigrationFiles,
  MIGRATION_REPLAY_TEST_TIMEOUT_MS,
} from '@blog/db/testing/migration-files';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';

import { siteConfig } from './site-config';
import { tenants } from './tenants';

const RENAME_MIGRATION =
  '0018_rename_category_empty_to_topic_empty_voice_override.sql';

async function setUpDbWithSiteConfigRow(
  voiceOverrides: Record<string, string>,
) {
  const client = new PGlite();
  const db = drizzle(client, { schema });

  const migrationFiles = listMigrationFiles();
  const priorMigrations = migrationFiles.filter(
    (file) => file < RENAME_MIGRATION,
  );
  const laterMigrations = migrationFiles.filter(
    (file) => file > RENAME_MIGRATION,
  );

  for (const file of priorMigrations) {
    await applyMigrationFile(db, file);
  }

  const [tenant] = await db
    .insert(tenants)
    .values({
      slug: 'acme',
      name: 'Acme',
      primaryDomain: 'acme.example.com',
      locale: 'en',
      plan: TENANT_PLAN.FREE,
      status: TENANT_STATUS.ACTIVE,
    })
    .returning();
  if (!tenant) throw new Error('failed to seed a tenant row');

  await db.insert(siteConfig).values({
    tenantId: tenant.id,
    preset: PRESET_ID.EDITORIAL,
    accentHue: 28,
    headingFont: FONT_CHOICE.FRAUNCES,
    bodyFont: FONT_CHOICE.INTER,
    radiusScale: RADIUS_SCALE.SM,
    density: DENSITY.COMPACT,
    voiceOverrides,
  });

  return { db, laterMigrations };
}

async function applyRenameMigration(
  db: Awaited<ReturnType<typeof setUpDbWithSiteConfigRow>>['db'],
  laterMigrations: string[],
) {
  await applyMigrationFile(db, RENAME_MIGRATION);
  for (const file of laterMigrations) {
    await applyMigrationFile(db, file);
  }
}

async function readVoiceOverrides(
  db: Awaited<ReturnType<typeof setUpDbWithSiteConfigRow>>['db'],
) {
  const [row] = await db.select().from(siteConfig);
  if (!row) throw new Error('expected a site_config row');
  return row.voiceOverrides;
}

// 0018 rewrites the single `voice_overrides` jsonb blob rather than a typed
// column, so every case below asserts the object shape directly.
describe(`${RENAME_MIGRATION} (voiceOverrides categoryEmpty -> topicEmpty rename)`, () => {
  it(
    'renames categoryEmpty to topicEmpty and preserves its value alongside other keys',
    async () => {
      const { db, laterMigrations } = await setUpDbWithSiteConfigRow({
        categoryEmpty: 'No posts in this topic yet.',
        tagEmpty: 'No posts with this tag yet.',
      });

      await applyRenameMigration(db, laterMigrations);

      expect(await readVoiceOverrides(db)).toEqual({
        topicEmpty: 'No posts in this topic yet.',
        tagEmpty: 'No posts with this tag yet.',
      });
    },
    MIGRATION_REPLAY_TEST_TIMEOUT_MS,
  );

  it(
    'leaves a row with no categoryEmpty key untouched',
    async () => {
      const { db, laterMigrations } = await setUpDbWithSiteConfigRow({
        tagEmpty: 'No posts with this tag yet.',
      });

      await applyRenameMigration(db, laterMigrations);

      expect(await readVoiceOverrides(db)).toEqual({
        tagEmpty: 'No posts with this tag yet.',
      });
    },
    MIGRATION_REPLAY_TEST_TIMEOUT_MS,
  );

  it(
    'leaves an empty voice_overrides object untouched',
    async () => {
      const { db, laterMigrations } = await setUpDbWithSiteConfigRow({});

      await applyRenameMigration(db, laterMigrations);

      expect(await readVoiceOverrides(db)).toEqual({});
    },
    MIGRATION_REPLAY_TEST_TIMEOUT_MS,
  );

  it(
    'leaves an already-migrated row (topicEmpty present, no categoryEmpty) untouched',
    async () => {
      const { db, laterMigrations } = await setUpDbWithSiteConfigRow({
        topicEmpty: 'No posts in this topic yet.',
      });

      await applyRenameMigration(db, laterMigrations);

      expect(await readVoiceOverrides(db)).toEqual({
        topicEmpty: 'No posts in this topic yet.',
      });
    },
    MIGRATION_REPLAY_TEST_TIMEOUT_MS,
  );

  it(
    'is idempotent: applying it a second time changes nothing',
    async () => {
      const { db, laterMigrations } = await setUpDbWithSiteConfigRow({
        categoryEmpty: 'No posts in this topic yet.',
        tagEmpty: 'No posts with this tag yet.',
      });

      await applyRenameMigration(db, laterMigrations);
      const afterFirstRun = await readVoiceOverrides(db);

      // The migration's own WHERE clause guards re-application; running its
      // UPDATE statement again must be a genuine no-op, not just an
      // observably-equal result.
      await applyMigrationFile(db, RENAME_MIGRATION);
      const afterSecondRun = await readVoiceOverrides(db);

      expect(afterSecondRun).toEqual(afterFirstRun);
      expect(afterSecondRun).toEqual({
        topicEmpty: 'No posts in this topic yet.',
        tagEmpty: 'No posts with this tag yet.',
      });
    },
    MIGRATION_REPLAY_TEST_TIMEOUT_MS,
  );

  it(
    'when both categoryEmpty and topicEmpty are present, topicEmpty ends up holding the old categoryEmpty value (jsonb || favours its right operand — accepted, not a bug)',
    async () => {
      const { db, laterMigrations } = await setUpDbWithSiteConfigRow({
        categoryEmpty: 'Old copy from categoryEmpty.',
        topicEmpty: 'Newer copy already under topicEmpty.',
      });

      await applyRenameMigration(db, laterMigrations);

      expect(await readVoiceOverrides(db)).toEqual({
        topicEmpty: 'Old copy from categoryEmpty.',
      });
    },
    MIGRATION_REPLAY_TEST_TIMEOUT_MS,
  );

  it(
    'still applies cleanly against an empty site_config table',
    async () => {
      const client = new PGlite();
      const db = drizzle(client, { schema });

      for (const file of listMigrationFiles()) {
        await applyMigrationFile(db, file);
      }

      const rows = await db.select().from(siteConfig);

      expect(rows).toHaveLength(0);
    },
    MIGRATION_REPLAY_TEST_TIMEOUT_MS,
  );
});
