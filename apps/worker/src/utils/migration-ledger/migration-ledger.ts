import {
  STUDIO_MIGRATION_IDS,
  type MigrationState,
  type TStarterDocument,
} from '@shinefold/config';

export type TMigrationLedger = TStarterDocument<MigrationState, 'applied'>;

type TLedgerEntry = TMigrationLedger['applied'][number];

export const MIGRATION_LEDGER_ID = 'migrationState';

// Not a Studio migration: the runner ignores ids it has no migration folder for.
export const GROWTH_LAYER_LEDGER_ENTRY_ID = 'growth-layer';

export function buildLedgerEntry(id: string, runAt: string): TLedgerEntry {
  return { _key: id, _type: 'appliedMigration', id, runAt };
}

// Seeded content is already at the current schema, so every migration is recorded as applied rather than left for a later run to replay.
export function buildAppliedMigrationLedger(runAt: string): TMigrationLedger {
  return {
    _id: MIGRATION_LEDGER_ID,
    _type: 'migrationState',
    applied: STUDIO_MIGRATION_IDS.map((id) => buildLedgerEntry(id, runAt)),
  };
}
