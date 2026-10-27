import { execFileSync } from 'node:child_process';

import {
  MOCK_TENANT_MIGRATE_CLI_ENV,
  MOCK_TENANT_MIGRATE_PARAMS,
} from '@blog/db/testing/migrate-tenant-content/fixtures';
import { faker } from '@faker-js/faker';

import { isTenantMigrationLedgerEmpty } from './read-tenant-migration-ledger';

vi.mock('node:child_process');

faker.seed(5805);

const MOCK_APPLIED_MIGRATION = {
  id: faker.string.alphanumeric(16),
  runAt: faker.date.past().toISOString(),
};
const MOCK_CLI_FAILURE = faker.lorem.sentence();

beforeEach(() => {
  vi.mocked(execFileSync).mockReturnValue('[]');
});

describe(isTenantMigrationLedgerEmpty, () => {
  it.each([
    ['no migrationState document exists yet', []],
    ['the ledger exists with no applied entries', [{ applied: [] }]],
    ['the ledger document has no applied field at all', [{}]],
  ])('is empty when %s', (_case, ledger) => {
    vi.mocked(execFileSync).mockReturnValue(JSON.stringify(ledger));

    expect(isTenantMigrationLedgerEmpty(MOCK_TENANT_MIGRATE_PARAMS)).toBe(true);
  });

  it('is not empty once the ledger has recorded an applied migration', () => {
    vi.mocked(execFileSync).mockReturnValue(
      JSON.stringify([{ applied: [MOCK_APPLIED_MIGRATION] }]),
    );

    expect(isTenantMigrationLedgerEmpty(MOCK_TENANT_MIGRATE_PARAMS)).toBe(
      false,
    );
  });

  it('overrides the per-tenant Sanity env vars for the CLI invocation', () => {
    isTenantMigrationLedgerEmpty(MOCK_TENANT_MIGRATE_PARAMS);

    const [, , options] = vi.mocked(execFileSync).mock.lastCall ?? [];

    expect(options?.env).toEqual({
      ...process.env,
      ...MOCK_TENANT_MIGRATE_CLI_ENV,
    });
  });

  it('propagates a systemic CLI failure', () => {
    const error = new Error(MOCK_CLI_FAILURE);
    vi.mocked(execFileSync).mockImplementation(() => {
      throw error;
    });

    expect(() =>
      isTenantMigrationLedgerEmpty(MOCK_TENANT_MIGRATE_PARAMS),
    ).toThrow(error);
  });
});
