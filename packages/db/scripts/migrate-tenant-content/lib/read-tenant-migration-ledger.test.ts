import { isTenantMigrationLedgerEmpty } from './read-tenant-migration-ledger';

const { execFileSyncMock } = vi.hoisted(() => ({ execFileSyncMock: vi.fn() }));

vi.mock('node:child_process', () => ({ execFileSync: execFileSyncMock }));

const params = {
  projectId: 'proj-1',
  dataset: 'production',
  token: 'write-token',
};

beforeEach(() => {
  execFileSyncMock.mockReset();
});

describe(isTenantMigrationLedgerEmpty, () => {
  it('is empty when no migrationState document exists yet', () => {
    execFileSyncMock.mockReturnValue('[]');

    expect(isTenantMigrationLedgerEmpty(params)).toBe(true);
  });

  it('is empty when the ledger exists with no applied entries', () => {
    execFileSyncMock.mockReturnValue(JSON.stringify([{ applied: [] }]));

    expect(isTenantMigrationLedgerEmpty(params)).toBe(true);
  });

  it('is empty when the ledger document has no applied field at all', () => {
    execFileSyncMock.mockReturnValue(JSON.stringify([{}]));

    expect(isTenantMigrationLedgerEmpty(params)).toBe(true);
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

    expect(isTenantMigrationLedgerEmpty(params)).toBe(false);
  });

  it('overrides the per-tenant Sanity env vars for the CLI invocation', () => {
    execFileSyncMock.mockReturnValue('[]');

    isTenantMigrationLedgerEmpty(params);

    expect(execFileSyncMock).toHaveBeenCalledWith(
      'pnpm',
      [
        'exec',
        'sanity',
        'documents',
        'query',
        '*[_id == "migrationState"]{applied}',
        '--api-version',
        '2024-08-01',
      ],
      expect.objectContaining({
        env: expect.objectContaining({
          SANITY_STUDIO_PROJECT_ID: 'proj-1',
          SANITY_STUDIO_DATASET: 'production',
          SANITY_AUTH_TOKEN: 'write-token',
        }),
      }),
    );
  });

  it('propagates a systemic CLI failure', () => {
    const error = new Error('ENOENT: pnpm not found');
    execFileSyncMock.mockImplementation(() => {
      throw error;
    });

    expect(() => isTenantMigrationLedgerEmpty(params)).toThrow(error);
  });
});
