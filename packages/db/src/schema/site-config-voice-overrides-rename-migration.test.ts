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

const RENAME_MIGRATION =
  '0018_rename_category_empty_to_topic_empty_voice_override.sql';
const MOCK_TOPIC_EMPTY_COPY = faker.lorem.sentence();
const MOCK_TAG_EMPTY_COPY = faker.lorem.sentence();
const MOCK_OLD_CATEGORY_EMPTY_COPY = faker.lorem.sentence();
const MOCK_NEWER_TOPIC_EMPTY_COPY = faker.lorem.sentence();

describe(`${RENAME_MIGRATION} (voiceOverrides categoryEmpty -> topicEmpty rename)`, () => {
  let db: PgliteDatabase<typeof schema>;

  beforeEach(async () => {
    db = await createEmptyTestDb();
    await applyMigrationsExcept(db, RENAME_MIGRATION);
  }, MIGRATION_REPLAY_TEST_TIMEOUT_MS);

  it.each([
    ['a row with no categoryEmpty key', { tagEmpty: MOCK_TAG_EMPTY_COPY }],
    ['an empty voice_overrides object', {}],
    ['an already-migrated row', { topicEmpty: MOCK_TOPIC_EMPTY_COPY }],
  ])(
    'leaves %s untouched',
    async (_label, voiceOverrides) => {
      const tenantId = await insertReplayVoiceOverrides(db, voiceOverrides);

      await applyMigrationFile(db, RENAME_MIGRATION);

      expect(await readReplayVoiceOverrides(db, tenantId)).toEqual(
        voiceOverrides,
      );
    },
    MIGRATION_REPLAY_TEST_TIMEOUT_MS,
  );

  it(
    'gives topicEmpty the old categoryEmpty value when both keys are present',
    async () => {
      const tenantId = await insertReplayVoiceOverrides(db, {
        categoryEmpty: MOCK_OLD_CATEGORY_EMPTY_COPY,
        topicEmpty: MOCK_NEWER_TOPIC_EMPTY_COPY,
      });

      await applyMigrationFile(db, RENAME_MIGRATION);

      expect(await readReplayVoiceOverrides(db, tenantId)).toEqual({
        topicEmpty: MOCK_OLD_CATEGORY_EMPTY_COPY,
      });
    },
    MIGRATION_REPLAY_TEST_TIMEOUT_MS,
  );

  describe('with categoryEmpty and tagEmpty set', () => {
    let tenantId: string;

    beforeEach(async () => {
      tenantId = await insertReplayVoiceOverrides(db, {
        categoryEmpty: MOCK_TOPIC_EMPTY_COPY,
        tagEmpty: MOCK_TAG_EMPTY_COPY,
      });
    }, MIGRATION_REPLAY_TEST_TIMEOUT_MS);

    it(
      'renames categoryEmpty to topicEmpty and keeps its value and other keys',
      async () => {
        await applyMigrationFile(db, RENAME_MIGRATION);

        expect(await readReplayVoiceOverrides(db, tenantId)).toEqual({
          topicEmpty: MOCK_TOPIC_EMPTY_COPY,
          tagEmpty: MOCK_TAG_EMPTY_COPY,
        });
      },
      MIGRATION_REPLAY_TEST_TIMEOUT_MS,
    );

    it(
      'changes nothing when applied a second time',
      async () => {
        await applyMigrationFile(db, RENAME_MIGRATION);

        await applyMigrationFile(db, RENAME_MIGRATION);

        expect(await readReplayVoiceOverrides(db, tenantId)).toEqual({
          topicEmpty: MOCK_TOPIC_EMPTY_COPY,
          tagEmpty: MOCK_TAG_EMPTY_COPY,
        });
      },
      MIGRATION_REPLAY_TEST_TIMEOUT_MS,
    );
  });
});
