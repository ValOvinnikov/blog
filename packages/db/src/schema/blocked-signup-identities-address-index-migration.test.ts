import { BLOCKED_IDENTITY_KIND } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { blockedSignupIdentities } from '@blog/db/schema/blocked-signup-identities';
import {
  MOCK_BLOCK_REASON,
  MOCK_BLOCKED_ADDRESS,
  MOCK_BLOCKED_ADDRESS_INDEX,
  MOCK_BLOCKED_DOMAIN,
} from '@blog/db/testing/blocked-signup-identities/fixtures';
import {
  applyMigrationFile,
  listMigrationFiles,
  MIGRATION_REPLAY_TEST_TIMEOUT_MS,
} from '@blog/db/testing/migration-files';
import { sha256Hex } from '@blog/utils/hash';
import { PGlite } from '@electric-sql/pglite';
import { drizzle, type PgliteDatabase } from 'drizzle-orm/pglite';

const INDEX_MIGRATION = '0052_remove_plain_hash_blocked_addresses.sql';

describe('0052_remove_plain_hash_blocked_addresses', () => {
  let db: PgliteDatabase<typeof schema>;

  beforeEach(() => {
    db = drizzle(new PGlite(), { schema });
  });

  it(
    'removes plain-hash address entries and keeps indexed addresses and domains',
    async () => {
      for (const file of listMigrationFiles()) {
        if (file >= INDEX_MIGRATION) break;
        await applyMigrationFile(db, file);
      }

      await db.insert(blockedSignupIdentities).values([
        {
          kind: BLOCKED_IDENTITY_KIND.ADDRESS,
          value: sha256Hex(MOCK_BLOCKED_ADDRESS),
          reason: MOCK_BLOCK_REASON,
        },
        {
          kind: BLOCKED_IDENTITY_KIND.ADDRESS,
          value: MOCK_BLOCKED_ADDRESS_INDEX,
          reason: MOCK_BLOCK_REASON,
        },
        {
          kind: BLOCKED_IDENTITY_KIND.DOMAIN,
          value: MOCK_BLOCKED_DOMAIN,
          reason: MOCK_BLOCK_REASON,
        },
      ]);

      await applyMigrationFile(db, INDEX_MIGRATION);

      const rows = await db
        .select({
          kind: blockedSignupIdentities.kind,
          value: blockedSignupIdentities.value,
        })
        .from(blockedSignupIdentities)
        .orderBy(blockedSignupIdentities.kind);

      expect(rows).toEqual([
        {
          kind: BLOCKED_IDENTITY_KIND.ADDRESS,
          value: MOCK_BLOCKED_ADDRESS_INDEX,
        },
        { kind: BLOCKED_IDENTITY_KIND.DOMAIN, value: MOCK_BLOCKED_DOMAIN },
      ]);
    },
    MIGRATION_REPLAY_TEST_TIMEOUT_MS,
  );
});
