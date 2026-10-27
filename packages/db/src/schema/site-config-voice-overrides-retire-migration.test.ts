import type * as schema from '@blog/db/schema';
import { createEmptyTestDb } from '@blog/db/testing/create-test-db';
import {
  applyMigrationFile,
  applyMigrationsExcept,
  insertReplayVoiceOverrides,
  MIGRATION_REPLAY_TEST_TIMEOUT_MS,
  readReplayVoiceOverrides,
} from '@blog/db/testing/migration-files';
import { faker } from '@faker-js/faker';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

faker.seed(6023);

const RETIRE_MIGRATION = '0029_retire_voice_override_keys.sql';
const RETIRED_KEYS = [
  'terminalPromptHost',
  'authPromptCommandSignIn',
  'authPromptCommandAccount',
  'bookmarksPromptCommand',
  'accountPrivacyPromptCommand',
  'accountNewsletterPromptCommand',
  'accountIdentityPromptCommand',
  'bookmarkToastSavedMessage',
  'bookmarkToastRemovedMessage',
  'notFoundMetaTitle',
  'notFoundMetaDescription',
];
const MOCK_BLOG_LIST_EMPTY = faker.lorem.sentence();
const MOCK_BOOKMARKS_EMPTY = faker.lorem.sentence();
const MOCK_HEADING = faker.lorem.words(2);
const MOCK_SUPPORTING_TEXT = faker.lorem.sentence();
const MOCK_RETURN_HOME = faker.lorem.words(2);
const MOCK_TAG_EMPTY = faker.lorem.sentence();
const MOCK_TOPICS_EMPTY = faker.lorem.sentence();
const MOCK_TOPIC_EMPTY = faker.lorem.sentence();

describe(`${RETIRE_MIGRATION} (voiceOverrides key retirement + 404 key renames)`, () => {
  let db: PgliteDatabase<typeof schema>;

  beforeEach(async () => {
    db = await createEmptyTestDb();
    await applyMigrationsExcept(db, RETIRE_MIGRATION);
  }, MIGRATION_REPLAY_TEST_TIMEOUT_MS);

  it(
    'strips every retired key and leaves the surviving keys untouched',
    async () => {
      const retiredOverrides = Object.fromEntries(
        RETIRED_KEYS.map((key) => [key, faker.lorem.words(2)]),
      );
      const survivingOverrides = {
        blogListEmpty: MOCK_BLOG_LIST_EMPTY,
        bookmarksEmpty: MOCK_BOOKMARKS_EMPTY,
      };
      const tenantId = await insertReplayVoiceOverrides(db, {
        ...retiredOverrides,
        ...survivingOverrides,
      });

      await applyMigrationFile(db, RETIRE_MIGRATION);

      expect(await readReplayVoiceOverrides(db, tenantId)).toEqual(
        survivingOverrides,
      );
    },
    MIGRATION_REPLAY_TEST_TIMEOUT_MS,
  );

  it(
    'renames the 404 heading and supporting text keys, preserving their values',
    async () => {
      const tenantId = await insertReplayVoiceOverrides(db, {
        notFoundCommandNotFound: MOCK_HEADING,
        notFoundDescription: MOCK_SUPPORTING_TEXT,
        notFoundReturnHome: MOCK_RETURN_HOME,
      });

      await applyMigrationFile(db, RETIRE_MIGRATION);

      expect(await readReplayVoiceOverrides(db, tenantId)).toEqual({
        notFoundHeading: MOCK_HEADING,
        notFoundSupportingText: MOCK_SUPPORTING_TEXT,
        notFoundReturnHome: MOCK_RETURN_HOME,
      });
    },
    MIGRATION_REPLAY_TEST_TIMEOUT_MS,
  );

  it(
    'renames a key without writing a null target when only one side is present',
    async () => {
      const tenantId = await insertReplayVoiceOverrides(db, {
        notFoundCommandNotFound: MOCK_HEADING,
      });

      await applyMigrationFile(db, RETIRE_MIGRATION);

      expect(await readReplayVoiceOverrides(db, tenantId)).toEqual({
        notFoundHeading: MOCK_HEADING,
      });
    },
    MIGRATION_REPLAY_TEST_TIMEOUT_MS,
  );

  it.each([
    [
      'a row with none of the affected keys',
      { tagEmpty: MOCK_TAG_EMPTY, topicsEmpty: MOCK_TOPICS_EMPTY },
    ],
    ['an empty voice_overrides object', {}],
    [
      'an already-migrated row',
      {
        notFoundHeading: MOCK_HEADING,
        notFoundSupportingText: MOCK_SUPPORTING_TEXT,
        topicEmpty: MOCK_TOPIC_EMPTY,
      },
    ],
  ])(
    'leaves %s untouched',
    async (_label, voiceOverrides) => {
      const tenantId = await insertReplayVoiceOverrides(db, voiceOverrides);

      await applyMigrationFile(db, RETIRE_MIGRATION);

      expect(await readReplayVoiceOverrides(db, tenantId)).toEqual(
        voiceOverrides,
      );
    },
    MIGRATION_REPLAY_TEST_TIMEOUT_MS,
  );

  it(
    'changes nothing when applied a second time',
    async () => {
      const tenantId = await insertReplayVoiceOverrides(db, {
        terminalPromptHost: faker.lorem.words(2),
        notFoundCommandNotFound: MOCK_HEADING,
        notFoundDescription: MOCK_SUPPORTING_TEXT,
        tagEmpty: MOCK_TAG_EMPTY,
      });

      await applyMigrationFile(db, RETIRE_MIGRATION);
      await applyMigrationFile(db, RETIRE_MIGRATION);

      expect(await readReplayVoiceOverrides(db, tenantId)).toEqual({
        notFoundHeading: MOCK_HEADING,
        notFoundSupportingText: MOCK_SUPPORTING_TEXT,
        tagEmpty: MOCK_TAG_EMPTY,
      });
    },
    MIGRATION_REPLAY_TEST_TIMEOUT_MS,
  );
});
