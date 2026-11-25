import { STUDIO_MIGRATION_IDS } from '@shinefold/config';
import { MOCK_NOW } from '@worker/testing/clock/frozen-clock';

import { buildAppliedMigrationLedger } from './migration-ledger';

const MOCK_RUN_AT = MOCK_NOW.toISOString();

describe(buildAppliedMigrationLedger, () => {
  let applied: ReturnType<typeof buildAppliedMigrationLedger>['applied'];

  beforeEach(() => {
    ({ applied } = buildAppliedMigrationLedger(MOCK_RUN_AT));
  });

  it('records every Studio migration as applied at the given time, in run order', () => {
    expect(applied.map(({ id }) => id)).toEqual(STUDIO_MIGRATION_IDS);
    expect(applied.every(({ runAt }) => runAt === MOCK_RUN_AT)).toBe(true);
  });

  it('gives every entry a unique array key', () => {
    expect(new Set(applied.map(({ _key }) => _key)).size).toBe(applied.length);
  });
});
