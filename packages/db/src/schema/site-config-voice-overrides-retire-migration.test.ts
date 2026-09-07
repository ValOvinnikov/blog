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

const RETIRE_MIGRATION = '0029_retire_voice_override_keys.sql';

async function setUpDbWithSiteConfigRow(
  voiceOverrides: Record<string, string>,
) {
  const client = new PGlite();
  const db = drizzle(client, { schema });

  // Every migration except the one under test runs up front, so the seed
  // inserts below (built from the current Drizzle schema) always match the
  // physical table — RETIRE_MIGRATION is a data-only UPDATE with no DDL of
  // its own, so applying it last doesn't change what it's testing.
  const otherMigrations = listMigrationFiles().filter(
    (file) => file !== RETIRE_MIGRATION,
  );

  for (const file of otherMigrations) {
    await applyMigrationFile(db, file);
  }

  const [tenant] = await db
    .insert(tenants)
    .values({
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

  return { db };
}

async function applyRetireMigration(
  db: Awaited<ReturnType<typeof setUpDbWithSiteConfigRow>>['db'],
) {
  await applyMigrationFile(db, RETIRE_MIGRATION);
}

async function readVoiceOverrides(
  db: Awaited<ReturnType<typeof setUpDbWithSiteConfigRow>>['db'],
) {
  const [row] = await db.select().from(siteConfig);
  if (!row) throw new Error('expected a site_config row');
  return row.voiceOverrides;
}

// 0029 rewrites the single `voice_overrides` jsonb blob rather than a typed
// column, so every case below asserts the object shape directly.
describe(`${RETIRE_MIGRATION} (voiceOverrides key retirement + 404 key renames)`, () => {
  it(
    'strips every retired key and leaves the surviving keys untouched',
    async () => {
      const { db } = await setUpDbWithSiteConfigRow({
        terminalPromptHost: '~/blog $',
        authPromptCommandSignIn: 'sign-in',
        authPromptCommandAccount: 'account',
        bookmarksPromptCommand: 'bookmarks',
        accountPrivacyPromptCommand: 'privacy',
        accountNewsletterPromptCommand: 'newsletter',
        accountIdentityPromptCommand: 'identity',
        bookmarkToastSavedMessage: 'stashed to ~/bookmarks',
        bookmarkToastRemovedMessage: 'removed from ~/bookmarks',
        notFoundMetaTitle: 'Not found',
        notFoundMetaDescription: "This route doesn't exist.",
        blogListEmpty: 'Nothing published yet.',
        bookmarksEmpty: 'No bookmarks yet.',
      });

      await applyRetireMigration(db);

      expect(await readVoiceOverrides(db)).toEqual({
        blogListEmpty: 'Nothing published yet.',
        bookmarksEmpty: 'No bookmarks yet.',
      });
    },
    MIGRATION_REPLAY_TEST_TIMEOUT_MS,
  );

  it(
    'renames notFoundCommandNotFound to notFoundHeading and notFoundDescription to notFoundSupportingText, preserving their values',
    async () => {
      const { db } = await setUpDbWithSiteConfigRow({
        notFoundCommandNotFound: 'Not found',
        notFoundDescription: "That route doesn't resolve to anything here.",
        notFoundReturnHome: 'Return home',
      });

      await applyRetireMigration(db);

      expect(await readVoiceOverrides(db)).toEqual({
        notFoundHeading: 'Not found',
        notFoundSupportingText: "That route doesn't resolve to anything here.",
        notFoundReturnHome: 'Return home',
      });
    },
    MIGRATION_REPLAY_TEST_TIMEOUT_MS,
  );

  it(
    'renames a key without writing a null-valued target when only one side is present',
    async () => {
      const { db } = await setUpDbWithSiteConfigRow({
        notFoundCommandNotFound: 'Not found',
      });

      await applyRetireMigration(db);

      const overrides = await readVoiceOverrides(db);
      expect(overrides).toEqual({ notFoundHeading: 'Not found' });
      expect(
        Object.prototype.hasOwnProperty.call(
          overrides,
          'notFoundSupportingText',
        ),
      ).toBe(false);
    },
    MIGRATION_REPLAY_TEST_TIMEOUT_MS,
  );

  it(
    'leaves a row with none of the affected keys untouched',
    async () => {
      const { db } = await setUpDbWithSiteConfigRow({
        tagEmpty: 'No posts with this tag yet.',
        topicsEmpty: 'No topics yet.',
      });

      await applyRetireMigration(db);

      expect(await readVoiceOverrides(db)).toEqual({
        tagEmpty: 'No posts with this tag yet.',
        topicsEmpty: 'No topics yet.',
      });
    },
    MIGRATION_REPLAY_TEST_TIMEOUT_MS,
  );

  it(
    'leaves an empty voice_overrides object untouched',
    async () => {
      const { db } = await setUpDbWithSiteConfigRow({});

      await applyRetireMigration(db);

      expect(await readVoiceOverrides(db)).toEqual({});
    },
    MIGRATION_REPLAY_TEST_TIMEOUT_MS,
  );

  it(
    'leaves an already-migrated row (new keys present, no retired keys) untouched',
    async () => {
      const { db } = await setUpDbWithSiteConfigRow({
        notFoundHeading: 'Not found',
        notFoundSupportingText: "That route doesn't exist.",
        topicEmpty: 'No posts in this topic yet.',
      });

      await applyRetireMigration(db);

      expect(await readVoiceOverrides(db)).toEqual({
        notFoundHeading: 'Not found',
        notFoundSupportingText: "That route doesn't exist.",
        topicEmpty: 'No posts in this topic yet.',
      });
    },
    MIGRATION_REPLAY_TEST_TIMEOUT_MS,
  );

  it(
    'is idempotent: applying it a second time changes nothing',
    async () => {
      const { db } = await setUpDbWithSiteConfigRow({
        terminalPromptHost: '~/blog $',
        notFoundCommandNotFound: 'Not found',
        notFoundDescription: "That route doesn't exist.",
        tagEmpty: 'No posts with this tag yet.',
      });

      await applyRetireMigration(db);
      const afterFirstRun = await readVoiceOverrides(db);

      // The migration's own WHERE clause guards re-application; running its
      // UPDATE statement again must be a genuine no-op, not just an
      // observably-equal result.
      await applyMigrationFile(db, RETIRE_MIGRATION);
      const afterSecondRun = await readVoiceOverrides(db);

      expect(afterSecondRun).toEqual(afterFirstRun);
      expect(afterSecondRun).toEqual({
        notFoundHeading: 'Not found',
        notFoundSupportingText: "That route doesn't exist.",
        tagEmpty: 'No posts with this tag yet.',
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
