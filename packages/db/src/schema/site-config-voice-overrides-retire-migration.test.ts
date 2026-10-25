import {
  DENSITY,
  FONT_CHOICE,
  LOCALE_ISO_CODES,
  PRESET_ID,
  RADIUS_SCALE,
} from '@blog/config/constants';
import { TENANT_PLAN, TENANT_STATUS } from '@blog/db/constants';
import { createEmptyTestDb } from '@blog/db/testing/create-test-db';
import {
  applyMigrationFile,
  listMigrationFiles,
  MIGRATION_REPLAY_TEST_TIMEOUT_MS,
} from '@blog/db/testing/migration-files';
import { sql } from 'drizzle-orm';

import { siteConfig } from './site-config';
import { tenants } from './tenants';

const BLOG_LIST_EMPTY = 'Nothing published yet.';
const BOOKMARKS_EMPTY = 'No bookmarks yet.';
const NOT_FOUND_DESCRIPTION = "That route doesn't resolve to anything here.";
const NOT_FOUND_RETURN_HOME = 'Return home';
const TAG_EMPTY = 'No posts with this tag yet.';
const TOPICS_EMPTY = 'No topics yet.';
const NOT_FOUND_SUPPORTING_TEXT = "That route doesn't exist.";
const TOPIC_EMPTY = 'No posts in this topic yet.';
const RETIRE_MIGRATION = '0029_retire_voice_override_keys.sql';

async function setUpDbWithSiteConfigRow(
  voiceOverrides: Record<string, string>,
) {
  const db = await createEmptyTestDb();

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
      locale: LOCALE_ISO_CODES.EN,
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
    voiceOverridesByLocale: sql`${JSON.stringify(voiceOverrides)}::jsonb`,
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
  return row.voiceOverridesByLocale;
}

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
        blogListEmpty: BLOG_LIST_EMPTY,
        bookmarksEmpty: BOOKMARKS_EMPTY,
      });

      await applyRetireMigration(db);

      expect(await readVoiceOverrides(db)).toEqual({
        blogListEmpty: BLOG_LIST_EMPTY,
        bookmarksEmpty: BOOKMARKS_EMPTY,
      });
    },
    MIGRATION_REPLAY_TEST_TIMEOUT_MS,
  );

  it(
    'renames notFoundCommandNotFound to notFoundHeading and notFoundDescription to notFoundSupportingText, preserving their values',
    async () => {
      const { db } = await setUpDbWithSiteConfigRow({
        notFoundCommandNotFound: 'Not found',
        notFoundDescription: NOT_FOUND_DESCRIPTION,
        notFoundReturnHome: NOT_FOUND_RETURN_HOME,
      });

      await applyRetireMigration(db);

      expect(await readVoiceOverrides(db)).toEqual({
        notFoundHeading: 'Not found',
        notFoundSupportingText: NOT_FOUND_DESCRIPTION,
        notFoundReturnHome: NOT_FOUND_RETURN_HOME,
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
        tagEmpty: TAG_EMPTY,
        topicsEmpty: TOPICS_EMPTY,
      });

      await applyRetireMigration(db);

      expect(await readVoiceOverrides(db)).toEqual({
        tagEmpty: TAG_EMPTY,
        topicsEmpty: TOPICS_EMPTY,
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
        notFoundSupportingText: NOT_FOUND_SUPPORTING_TEXT,
        topicEmpty: TOPIC_EMPTY,
      });

      await applyRetireMigration(db);

      expect(await readVoiceOverrides(db)).toEqual({
        notFoundHeading: 'Not found',
        notFoundSupportingText: NOT_FOUND_SUPPORTING_TEXT,
        topicEmpty: TOPIC_EMPTY,
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
        notFoundDescription: NOT_FOUND_SUPPORTING_TEXT,
        tagEmpty: TAG_EMPTY,
      });

      await applyRetireMigration(db);
      const afterFirstRun = await readVoiceOverrides(db);

      await applyMigrationFile(db, RETIRE_MIGRATION);
      const afterSecondRun = await readVoiceOverrides(db);

      expect(afterSecondRun).toEqual(afterFirstRun);
      expect(afterSecondRun).toEqual({
        notFoundHeading: 'Not found',
        notFoundSupportingText: NOT_FOUND_SUPPORTING_TEXT,
        tagEmpty: TAG_EMPTY,
      });
    },
    MIGRATION_REPLAY_TEST_TIMEOUT_MS,
  );

  it(
    'still applies cleanly against an empty site_config table',
    async () => {
      const db = await createEmptyTestDb();

      for (const file of listMigrationFiles()) {
        await applyMigrationFile(db, file);
      }

      const rows = await db.select().from(siteConfig);

      expect(rows).toHaveLength(0);
    },
    MIGRATION_REPLAY_TEST_TIMEOUT_MS,
  );
});
