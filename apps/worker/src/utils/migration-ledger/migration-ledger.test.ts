import { STUDIO_MIGRATION_IDS } from '@blog/config';
import { MOCK_NOW } from '@worker/testing/clock/frozen-clock';

import { buildAppliedMigrationLedger } from './migration-ledger';

const MOCK_RUN_AT = MOCK_NOW.toISOString();

describe(buildAppliedMigrationLedger, () => {
  it('records every Studio migration as applied at the given time, in run order', () => {
    const { applied } = buildAppliedMigrationLedger(MOCK_RUN_AT);

    expect(applied.map(({ id }) => id)).toEqual(STUDIO_MIGRATION_IDS);
    expect(applied.every(({ runAt }) => runAt === MOCK_RUN_AT)).toBe(true);
  });

  it('gives every entry a unique array key', () => {
    const { applied } = buildAppliedMigrationLedger(MOCK_RUN_AT);

    expect(new Set(applied.map(({ _key }) => _key)).size).toBe(applied.length);
  });
});
