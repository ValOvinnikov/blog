import {
  STUDIO_MIGRATION_IDS,
  type MigrationState,
  type TStarterDocument,
} from '@blog/config';

export type TMigrationLedger = TStarterDocument<MigrationState, 'applied'>;

const MIGRATION_LEDGER_ID = 'migrationState';

// Seeded content is already at the current schema, so every migration is recorded as applied rather than left for a later run to replay.
export function buildAppliedMigrationLedger(runAt: string): TMigrationLedger {
  return {
    _id: MIGRATION_LEDGER_ID,
    _type: 'migrationState',
    applied: STUDIO_MIGRATION_IDS.map((id) => ({
      _key: id,
      _type: 'appliedMigration',
      id,
      runAt,
    })),
  };
}
