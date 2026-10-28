import { join } from 'node:path';

import { TENANT_STATUS } from '@blog/db/constants';
import { MOCK_NOW, useFrozenClock } from '@blog/db/testing/frozen-clock';
import { mockTenantSanityCredentials } from '@blog/db/testing/tenant-sanity-credentials/fixtures';
import {
  MOCK_MISSING_TENANT_ID,
  mockTenant,
} from '@blog/db/testing/tenants/fixtures';
import { faker } from '@faker-js/faker';

import type { TMigrateSummary } from './lib/migrate-tenant';
import {
  hasSystemicFailures,
  runMigration,
  runMigrationForTenant,
} from './run';

const {
  listActiveTenantsMock,
  getTenantByIdMock,
  getTenantSanityWriteCredentialsMock,
  recordTenantContentMigrationFailureMock,
  clearTenantContentMigrationFailureMock,
  isTenantMigrationLedgerEmptyMock,
  runTenantMigrationDeployMock,
  exportTenantDatasetMock,
} = vi.hoisted(() => ({
  listActiveTenantsMock: vi.fn(),
  getTenantByIdMock: vi.fn(),
  getTenantSanityWriteCredentialsMock: vi.fn(),
  recordTenantContentMigrationFailureMock: vi.fn(),
  clearTenantContentMigrationFailureMock: vi.fn(),
  isTenantMigrationLedgerEmptyMock: vi.fn(),
  runTenantMigrationDeployMock: vi.fn(),
  exportTenantDatasetMock: vi.fn(),
}));

vi.mock('@blog/db/queries/tenants', () => ({
  listActiveTenants: listActiveTenantsMock,
  getTenantById: getTenantByIdMock,
  getTenantSanityWriteCredentials: getTenantSanityWriteCredentialsMock,
  recordTenantContentMigrationFailure: recordTenantContentMigrationFailureMock,
  clearTenantContentMigrationFailure: clearTenantContentMigrationFailureMock,
}));
vi.mock('./lib/read-tenant-migration-ledger', () => ({
  isTenantMigrationLedgerEmpty: isTenantMigrationLedgerEmptyMock,
}));
vi.mock('./lib/run-tenant-migrate-script', () => ({
  runTenantMigrationDeploy: runTenantMigrationDeployMock,
  exportTenantDataset: exportTenantDatasetMock,
}));

faker.seed(5804);

const EXPORT_CALL = 'export';
const DEPLOY_CALL = 'deploy';

const MOCK_EXPORT_DIR = faker.system.directoryPath();
const MOCK_TENANT = mockTenant();
const MOCK_TENANTS = [MOCK_TENANT, mockTenant(), mockTenant()];
const MOCK_CREDENTIALS = mockTenantSanityCredentials();
const MOCK_DEPROVISIONED_AT = faker.date.past();
const MOCK_MIGRATION_ERROR = faker.lorem.sentence();
const MOCK_LEDGER_ERROR = faker.lorem.sentence();
const MOCK_EXPORT_ERROR = faker.lorem.sentence();
const MOCK_RECORD_ERROR = faker.lorem.sentence();
const MOCK_FAILED_TENANT = mockTenant({
  contentMigrationFailedAt: faker.date.past({ refDate: MOCK_NOW }),
});
const MOCK_EMPTY_SUMMARY: TMigrateSummary = {
  checked: 0,
  migrated: 0,
  backfilled: 0,
  skipped: 0,
  errors: 0,
};

useFrozenClock();

beforeEach(() => {
  listActiveTenantsMock.mockResolvedValue([]);
  getTenantSanityWriteCredentialsMock.mockResolvedValue(MOCK_CREDENTIALS);
  isTenantMigrationLedgerEmptyMock.mockReturnValue(false);
});

describe(runMigration, () => {
  it('is a clean no-op when there are no in-scope tenants', async () => {
    const summary = await runMigration();

    expect(summary).toEqual(MOCK_EMPTY_SUMMARY);
  });

  it("one tenant's failure does not abort the sweep for the rest", async () => {
    listActiveTenantsMock.mockResolvedValue(MOCK_TENANTS);
    runTenantMigrationDeployMock
      .mockImplementationOnce(() => undefined)
      .mockImplementationOnce(() => {
        throw new Error(MOCK_MIGRATION_ERROR);
      })
      .mockImplementationOnce(() => undefined);

    const summary = await runMigration();

    expect(summary).toEqual({
      ...MOCK_EMPTY_SUMMARY,
      checked: 3,
      migrated: 2,
      errors: 1,
    });
    expect(runTenantMigrationDeployMock).toHaveBeenCalledTimes(3);
    expect(hasSystemicFailures(summary)).toBe(true);
  });

  it('counts a failed ledger read as an error for that tenant only', async () => {
    listActiveTenantsMock.mockResolvedValue(MOCK_TENANTS.slice(0, 2));
    isTenantMigrationLedgerEmptyMock
      .mockImplementationOnce(() => {
        throw new Error(MOCK_LEDGER_ERROR);
      })
      .mockImplementationOnce(() => false);

    const summary = await runMigration();

    expect(summary).toEqual({
      ...MOCK_EMPTY_SUMMARY,
      checked: 2,
      migrated: 1,
      errors: 1,
    });
    expect(runTenantMigrationDeployMock).toHaveBeenCalledTimes(1);
  });

  describe('with one active tenant', () => {
    beforeEach(() => {
      listActiveTenantsMock.mockResolvedValue([MOCK_TENANT]);
    });

    it.each([
      [
        'a normal deploy for a tenant with a non-empty ledger',
        false,
        { migrated: 1, backfilled: 0 },
      ],
      [
        'a backfill for a tenant with an empty ledger',
        true,
        { migrated: 0, backfilled: 1 },
      ],
    ])('runs %s', async (_title, ledgerEmpty, tally) => {
      isTenantMigrationLedgerEmptyMock.mockReturnValue(ledgerEmpty);

      const summary = await runMigration();

      expect(summary).toEqual({ ...MOCK_EMPTY_SUMMARY, checked: 1, ...tally });
      expect(getTenantSanityWriteCredentialsMock).toHaveBeenCalledWith(
        MOCK_TENANT.id,
      );
      expect(runTenantMigrationDeployMock).toHaveBeenCalledWith({
        ...MOCK_CREDENTIALS,
        backfill: ledgerEmpty,
      });
    });

    it('migrates without exporting when no export directory is set', async () => {
      await runMigration();

      expect(exportTenantDatasetMock).not.toHaveBeenCalled();
      expect(runTenantMigrationDeployMock).toHaveBeenCalledTimes(1);
    });

    describe('with an export directory set', () => {
      beforeEach(() => {
        vi.stubEnv('TENANT_EXPORT_DIR', MOCK_EXPORT_DIR);
      });

      it('exports the tenant dataset before migrating it', async () => {
        const calls: string[] = [];
        exportTenantDatasetMock.mockImplementation(() =>
          calls.push(EXPORT_CALL),
        );
        runTenantMigrationDeployMock.mockImplementation(() =>
          calls.push(DEPLOY_CALL),
        );

        await runMigration();

        expect(exportTenantDatasetMock).toHaveBeenCalledWith(
          MOCK_CREDENTIALS,
          join(MOCK_EXPORT_DIR, `${MOCK_TENANT.id}.tar.gz`),
        );
        expect(calls).toEqual([EXPORT_CALL, DEPLOY_CALL]);
      });

      it('skips migrating a tenant whose export failed and counts an error', async () => {
        exportTenantDatasetMock.mockImplementation(() => {
          throw new Error(MOCK_EXPORT_ERROR);
        });

        const summary = await runMigration();

        expect(summary).toEqual({
          ...MOCK_EMPTY_SUMMARY,
          checked: 1,
          errors: 1,
        });
        expect(runTenantMigrationDeployMock).not.toHaveBeenCalled();
      });
    });

    it.each([
      ['has no Sanity write credentials yet', undefined],
      [
        'resolves to a non-ACTIVE status',
        { ...MOCK_CREDENTIALS, status: TENANT_STATUS.SUSPENDED },
      ],
      [
        'resolves to a deprovisioned timestamp',
        { ...MOCK_CREDENTIALS, deprovisionedAt: MOCK_DEPROVISIONED_AT },
      ],
    ])('tallies a tenant that %s as skipped', async (_case, resolved) => {
      getTenantSanityWriteCredentialsMock.mockResolvedValue(resolved);

      const summary = await runMigration();

      expect(summary).toEqual({
        ...MOCK_EMPTY_SUMMARY,
        checked: 1,
        skipped: 1,
      });
      expect(isTenantMigrationLedgerEmptyMock).not.toHaveBeenCalled();
      expect(runTenantMigrationDeployMock).not.toHaveBeenCalled();
    });
  });
});

describe('the content migration failure record', () => {
  it('records the failure time on the failed tenant only', async () => {
    listActiveTenantsMock.mockResolvedValue(MOCK_TENANTS);
    runTenantMigrationDeployMock
      .mockImplementationOnce(() => undefined)
      .mockImplementationOnce(() => {
        throw new Error(MOCK_MIGRATION_ERROR);
      })
      .mockImplementationOnce(() => undefined);

    await runMigration();

    expect(recordTenantContentMigrationFailureMock).toHaveBeenCalledTimes(1);
    expect(recordTenantContentMigrationFailureMock).toHaveBeenCalledWith(
      MOCK_TENANTS[1]?.id,
      MOCK_NOW,
    );
  });

  it.each([
    ['migrates', false],
    ['backfills', true],
  ])(
    'clears the record when a previously failed tenant %s',
    async (_case, ledgerEmpty) => {
      listActiveTenantsMock.mockResolvedValue([MOCK_FAILED_TENANT]);
      isTenantMigrationLedgerEmptyMock.mockReturnValue(ledgerEmpty);

      await runMigration();

      expect(clearTenantContentMigrationFailureMock).toHaveBeenCalledWith(
        MOCK_FAILED_TENANT.id,
      );
      expect(recordTenantContentMigrationFailureMock).not.toHaveBeenCalled();
    },
  );

  it('clears the record when a single-tenant run succeeds', async () => {
    getTenantByIdMock.mockResolvedValue(MOCK_FAILED_TENANT);

    await runMigrationForTenant(MOCK_FAILED_TENANT.id);

    expect(clearTenantContentMigrationFailureMock).toHaveBeenCalledWith(
      MOCK_FAILED_TENANT.id,
    );
  });

  it('leaves the record alone for a tenant that never failed', async () => {
    listActiveTenantsMock.mockResolvedValue([MOCK_TENANT]);

    await runMigration();

    expect(clearTenantContentMigrationFailureMock).not.toHaveBeenCalled();
    expect(recordTenantContentMigrationFailureMock).not.toHaveBeenCalled();
  });

  it('leaves the record alone for a skipped tenant', async () => {
    listActiveTenantsMock.mockResolvedValue([MOCK_FAILED_TENANT]);
    getTenantSanityWriteCredentialsMock.mockResolvedValue({
      ...MOCK_CREDENTIALS,
      status: TENANT_STATUS.SUSPENDED,
    });

    await runMigration();

    expect(clearTenantContentMigrationFailureMock).not.toHaveBeenCalled();
    expect(recordTenantContentMigrationFailureMock).not.toHaveBeenCalled();
  });

  it('still reports the original failure when recording it fails', async () => {
    listActiveTenantsMock.mockResolvedValue([MOCK_TENANT]);
    runTenantMigrationDeployMock.mockImplementation(() => {
      throw new Error(MOCK_MIGRATION_ERROR);
    });
    recordTenantContentMigrationFailureMock.mockRejectedValue(
      new Error(MOCK_RECORD_ERROR),
    );

    const summary = await runMigration();

    expect(summary).toEqual({ ...MOCK_EMPTY_SUMMARY, checked: 1, errors: 1 });
    expect(hasSystemicFailures(summary)).toBe(true);
  });

  it('counts a successful tenant as migrated when clearing its record fails', async () => {
    listActiveTenantsMock.mockResolvedValue([MOCK_FAILED_TENANT]);
    clearTenantContentMigrationFailureMock.mockRejectedValue(
      new Error(MOCK_RECORD_ERROR),
    );

    const summary = await runMigration();

    expect(summary).toEqual({ ...MOCK_EMPTY_SUMMARY, checked: 1, migrated: 1 });
  });
});

describe(runMigrationForTenant, () => {
  it('migrates only the given tenant', async () => {
    getTenantByIdMock.mockResolvedValue(MOCK_TENANT);

    const summary = await runMigrationForTenant(MOCK_TENANT.id);

    expect(summary.checked).toBe(1);
    expect(getTenantByIdMock).toHaveBeenCalledWith(MOCK_TENANT.id);
    expect(listActiveTenantsMock).not.toHaveBeenCalled();
  });

  it('returns an empty summary when the tenant id does not resolve', async () => {
    getTenantByIdMock.mockResolvedValue(undefined);

    const summary = await runMigrationForTenant(MOCK_MISSING_TENANT_ID);

    expect(summary.checked).toBe(0);
    expect(runTenantMigrationDeployMock).not.toHaveBeenCalled();
  });
});

describe(hasSystemicFailures, () => {
  it.each([
    ['false when every candidate resolved to an expected outcome', 0, false],
    ['true when at least one candidate threw', 1, true],
  ])('is %s', (_case, errors, expected) => {
    const summary = { ...MOCK_EMPTY_SUMMARY, checked: 3, migrated: 2, errors };

    expect(hasSystemicFailures(summary)).toBe(expected);
  });
});
