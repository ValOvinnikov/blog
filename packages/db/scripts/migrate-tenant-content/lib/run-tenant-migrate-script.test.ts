import {
  MOCK_TENANT_MIGRATE_CLI_ENV,
  MOCK_TENANT_MIGRATE_PARAMS,
} from '@blog/db/testing/migrate-tenant-content/fixtures';

import {
  exportTenantDataset,
  runTenantMigrationDeploy,
} from './run-tenant-migrate-script';

const { execFileSyncMock } = vi.hoisted(() => ({ execFileSyncMock: vi.fn() }));

vi.mock('node:child_process', () => ({ execFileSync: execFileSyncMock }));

const EXEC_ENV = { ...process.env, ...MOCK_TENANT_MIGRATE_CLI_ENV };

function lastExecCall() {
  const [command, args, { env }] = execFileSyncMock.mock.lastCall ?? [];

  return { command, args, env };
}
const MIGRATE_SCRIPT = 'scripts/migrate.mjs';
const MOCK_EXPORT_DESTINATION = '/tmp/exports/t1.tar.gz';

beforeEach(() => {
  execFileSyncMock.mockReset();
});

describe(runTenantMigrationDeploy, () => {
  it('runs a normal deploy without --backfill', () => {
    runTenantMigrationDeploy({
      ...MOCK_TENANT_MIGRATE_PARAMS,
      backfill: false,
    });

    expect(lastExecCall()).toEqual({
      command: 'node',
      args: [MIGRATE_SCRIPT, 'deploy', '--yes'],
      env: EXEC_ENV,
    });
  });

  it('adds --backfill for a tenant with an empty ledger', () => {
    runTenantMigrationDeploy({ ...MOCK_TENANT_MIGRATE_PARAMS, backfill: true });

    expect(lastExecCall()).toEqual({
      command: 'node',
      args: [MIGRATE_SCRIPT, 'deploy', '--yes', '--backfill'],
      env: EXEC_ENV,
    });
  });

  it('propagates a failed deploy', () => {
    const error = new Error('migration run failed');
    execFileSyncMock.mockImplementation(() => {
      throw error;
    });

    expect(() =>
      runTenantMigrationDeploy({
        ...MOCK_TENANT_MIGRATE_PARAMS,
        backfill: false,
      }),
    ).toThrow(error);
  });
});

describe(exportTenantDataset, () => {
  it("exports the tenant's own dataset to the given destination", () => {
    exportTenantDataset(MOCK_TENANT_MIGRATE_PARAMS, MOCK_EXPORT_DESTINATION);

    expect(lastExecCall()).toEqual({
      command: 'node',
      args: [MIGRATE_SCRIPT, 'export', MOCK_EXPORT_DESTINATION],
      env: EXEC_ENV,
    });
  });
});
