import {
  MOCK_TENANT_MIGRATE_CLI_ENV,
  MOCK_TENANT_MIGRATE_PARAMS,
} from '@blog/db/testing/migrate-tenant-content/fixtures';

import { isTenantMigrationLedgerEmpty } from './read-tenant-migration-ledger';

const { execFileSyncMock } = vi.hoisted(() => ({ execFileSyncMock: vi.fn() }));

vi.mock('node:child_process', () => ({ execFileSync: execFileSyncMock }));

beforeEach(() => {
  execFileSyncMock.mockReset().mockReturnValue('[]');
});

describe(isTenantMigrationLedgerEmpty, () => {
  it.each([
    ['no migrationState document exists yet', []],
    ['the ledger exists with no applied entries', [{ applied: [] }]],
    ['the ledger document has no applied field at all', [{}]],
  ])('is empty when %s', (_case, ledger) => {
    execFileSyncMock.mockReturnValue(JSON.stringify(ledger));

    expect(isTenantMigrationLedgerEmpty(MOCK_TENANT_MIGRATE_PARAMS)).toBe(true);
  });

  it('is not empty once the ledger has recorded an applied migration', () => {
    execFileSyncMock.mockReturnValue(
      JSON.stringify([
        {
          applied: [
            {
              id: '20260101T0000-unify-links',
              runAt: '2026-01-01T00:00:00.000Z',
            },
          ],
        },
      ]),
    );

    expect(isTenantMigrationLedgerEmpty(MOCK_TENANT_MIGRATE_PARAMS)).toBe(
      false,
    );
  });

  it('overrides the per-tenant Sanity env vars for the CLI invocation', () => {
    isTenantMigrationLedgerEmpty(MOCK_TENANT_MIGRATE_PARAMS);

    const [command, args, { env }] = execFileSyncMock.mock.lastCall ?? [];

    expect({ command, args, env }).toEqual({
      command: 'pnpm',
      args: [
        'exec',
        'sanity',
        'documents',
        'query',
        '*[_id == "migrationState"]{applied}',
        '--api-version',
        '2024-08-01',
      ],
      env: { ...process.env, ...MOCK_TENANT_MIGRATE_CLI_ENV },
    });
  });

  it('propagates a systemic CLI failure', () => {
    const error = new Error('ENOENT: pnpm not found');
    execFileSyncMock.mockImplementation(() => {
      throw error;
    });

    expect(() =>
      isTenantMigrationLedgerEmpty(MOCK_TENANT_MIGRATE_PARAMS),
    ).toThrow(error);
  });
});
