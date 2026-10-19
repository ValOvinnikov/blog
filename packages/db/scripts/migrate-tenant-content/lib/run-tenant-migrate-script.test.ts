import {
  exportTenantDataset,
  runTenantMigrationDeploy,
} from './run-tenant-migrate-script';

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

describe(runTenantMigrationDeploy, () => {
  it('runs a normal deploy without --backfill', () => {
    runTenantMigrationDeploy({ ...params, backfill: false });

    expect(execFileSyncMock).toHaveBeenCalledWith(
      'node',
      ['scripts/migrate.mjs', 'deploy', '--yes'],
      expect.objectContaining({
        env: expect.objectContaining({
          SANITY_STUDIO_PROJECT_ID: 'proj-1',
          SANITY_STUDIO_DATASET: 'production',
          SANITY_AUTH_TOKEN: 'write-token',
        }),
        stdio: 'inherit',
      }),
    );
  });

  it('adds --backfill for a tenant with an empty ledger', () => {
    runTenantMigrationDeploy({ ...params, backfill: true });

    expect(execFileSyncMock).toHaveBeenCalledWith(
      'node',
      ['scripts/migrate.mjs', 'deploy', '--yes', '--backfill'],
      expect.anything(),
    );
  });

  it('propagates a failed deploy', () => {
    const error = new Error('migration run failed');
    execFileSyncMock.mockImplementation(() => {
      throw error;
    });

    expect(() =>
      runTenantMigrationDeploy({ ...params, backfill: false }),
    ).toThrow(error);
  });
});

describe(exportTenantDataset, () => {
  it("exports the tenant's own dataset to the given destination", () => {
    exportTenantDataset(params, '/tmp/exports/t1.tar.gz');

    expect(execFileSyncMock).toHaveBeenCalledWith(
      'node',
      ['scripts/migrate.mjs', 'export', '/tmp/exports/t1.tar.gz'],
      expect.objectContaining({
        env: expect.objectContaining({
          SANITY_STUDIO_PROJECT_ID: 'proj-1',
          SANITY_STUDIO_DATASET: 'production',
          SANITY_AUTH_TOKEN: 'write-token',
        }),
      }),
    );
  });
});
