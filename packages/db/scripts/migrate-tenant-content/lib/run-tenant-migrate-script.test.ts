import { execFileSync } from 'node:child_process';

import {
  MOCK_TENANT_MIGRATE_CLI_ENV,
  MOCK_TENANT_MIGRATE_PARAMS,
} from '@blog/db/testing/migrate-tenant-content/fixtures';
import { faker } from '@faker-js/faker';

import {
  exportTenantDataset,
  runTenantMigrationDeploy,
} from './run-tenant-migrate-script';

vi.mock('node:child_process');

faker.seed(5806);

const MIGRATE_SCRIPT = 'scripts/migrate.mjs';
const MOCK_EXPORT_DESTINATION = faker.system.filePath();
const MOCK_DEPLOY_FAILURE = faker.lorem.sentence();

function lastExecCall() {
  const [command, args, options] = vi.mocked(execFileSync).mock.lastCall ?? [];

  return { command, args, env: options?.env, stdio: options?.stdio };
}

const EXEC_OPTIONS = {
  env: { ...process.env, ...MOCK_TENANT_MIGRATE_CLI_ENV },
  stdio: 'inherit',
};

describe(runTenantMigrationDeploy, () => {
  it.each([
    ['runs a normal deploy without --backfill', false, []],
    ['adds --backfill for a tenant with an empty ledger', true, ['--backfill']],
  ])('%s', (_case, backfill, extraArgs) => {
    runTenantMigrationDeploy({ ...MOCK_TENANT_MIGRATE_PARAMS, backfill });

    expect(lastExecCall()).toEqual({
      command: 'node',
      args: [MIGRATE_SCRIPT, 'deploy', '--yes', ...extraArgs],
      ...EXEC_OPTIONS,
    });
  });

  it('propagates a failed deploy', () => {
    const error = new Error(MOCK_DEPLOY_FAILURE);
    vi.mocked(execFileSync).mockImplementation(() => {
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
      ...EXEC_OPTIONS,
    });
  });
});
