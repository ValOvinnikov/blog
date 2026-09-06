import { TENANT_STATUS } from '@blog/db/constants';
import type { TTenant } from '@blog/db/schema/tenants';

import {
  hasSystemicFailures,
  runMigration,
  runMigrationForTenant,
} from './run';

const { listActiveTenantsMock } = vi.hoisted(() => ({
  listActiveTenantsMock: vi.fn(),
}));
const { getTenantByIdMock } = vi.hoisted(() => ({
  getTenantByIdMock: vi.fn(),
}));
const { getTenantSanityWriteCredentialsMock } = vi.hoisted(() => ({
  getTenantSanityWriteCredentialsMock: vi.fn(),
}));
const { isTenantMigrationLedgerEmptyMock } = vi.hoisted(() => ({
  isTenantMigrationLedgerEmptyMock: vi.fn(),
}));
const { runTenantMigrationDeployMock } = vi.hoisted(() => ({
  runTenantMigrationDeployMock: vi.fn(),
}));

vi.mock('@blog/db/queries/tenants', () => ({
  listActiveTenants: listActiveTenantsMock,
  getTenantById: getTenantByIdMock,
  getTenantSanityWriteCredentials: getTenantSanityWriteCredentialsMock,
}));
vi.mock('./lib/read-tenant-migration-ledger', () => ({
  isTenantMigrationLedgerEmpty: isTenantMigrationLedgerEmptyMock,
}));
vi.mock('./lib/run-tenant-migration-deploy', () => ({
  runTenantMigrationDeploy: runTenantMigrationDeployMock,
}));

function tenant(id: string, name: string): TTenant {
  return {
    id,
    name,
    primaryDomain: `${name}.example.com`,
    sanityProjectId: `proj-${name}`,
    sanityDataset: 'production',
    sanityReadTokenEncrypted: 'encrypted',
    sanityWriteTokenEncrypted: 'encrypted',
    locale: 'en',
    plan: 'FREE',
    status: TENANT_STATUS.ACTIVE,
    provisioningStatus: 'READY',
    provisioningSteps: null,
    lastNotifiedOwnerElevationOutcome: null,
    seededAt: null,
    webhookCreatedAt: null,
    deprovisionedAt: null,
    deprovisioningSteps: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };
}

function credentials(tenantId: string) {
  return {
    projectId: `proj-${tenantId}`,
    dataset: 'production',
    token: `token-${tenantId}`,
    status: TENANT_STATUS.ACTIVE,
    deprovisionedAt: null,
    provisioningStatus: 'READY',
  };
}

beforeEach(() => {
  listActiveTenantsMock.mockReset().mockResolvedValue([]);
  getTenantByIdMock.mockReset();
  getTenantSanityWriteCredentialsMock
    .mockReset()
    .mockImplementation((tenantId: string) =>
      Promise.resolve(credentials(tenantId)),
    );
  isTenantMigrationLedgerEmptyMock.mockReset().mockReturnValue(false);
  runTenantMigrationDeployMock.mockReset();
});

describe(runMigration, () => {
  it('is a clean no-op when there are no in-scope tenants', async () => {
    const summary = await runMigration();

    expect(summary).toEqual({
      checked: 0,
      migrated: 0,
      backfilled: 0,
      skipped: 0,
      errors: 0,
    });
  });

  it('runs a normal deploy for a tenant with a non-empty ledger', async () => {
    listActiveTenantsMock.mockResolvedValue([tenant('t1', 'acme')]);
    isTenantMigrationLedgerEmptyMock.mockReturnValue(false);

    const summary = await runMigration();

    expect(summary).toEqual({
      checked: 1,
      migrated: 1,
      backfilled: 0,
      skipped: 0,
      errors: 0,
    });
    expect(runTenantMigrationDeployMock).toHaveBeenCalledWith(
      expect.objectContaining({ backfill: false }),
    );
  });

  it('backfills instead of replaying for a tenant with an empty ledger', async () => {
    listActiveTenantsMock.mockResolvedValue([tenant('t1', 'acme')]);
    isTenantMigrationLedgerEmptyMock.mockReturnValue(true);

    const summary = await runMigration();

    expect(summary).toEqual({
      checked: 1,
      migrated: 0,
      backfilled: 1,
      skipped: 0,
      errors: 0,
    });
    expect(runTenantMigrationDeployMock).toHaveBeenCalledWith(
      expect.objectContaining({ backfill: true }),
    );
  });

  it('tallies a tenant with no Sanity write credentials yet as skipped', async () => {
    listActiveTenantsMock.mockResolvedValue([tenant('t1', 'acme')]);
    getTenantSanityWriteCredentialsMock.mockResolvedValue(undefined);

    const summary = await runMigration();

    expect(summary).toEqual({
      checked: 1,
      migrated: 0,
      backfilled: 0,
      skipped: 1,
      errors: 0,
    });
    expect(isTenantMigrationLedgerEmptyMock).not.toHaveBeenCalled();
    expect(runTenantMigrationDeployMock).not.toHaveBeenCalled();
  });

  it('skips a tenant whose credentials resolve to a non-ACTIVE status', async () => {
    listActiveTenantsMock.mockResolvedValue([tenant('t1', 'acme')]);
    getTenantSanityWriteCredentialsMock.mockResolvedValue({
      ...credentials('t1'),
      status: TENANT_STATUS.SUSPENDED,
    });

    const summary = await runMigration();

    expect(summary).toEqual({
      checked: 1,
      migrated: 0,
      backfilled: 0,
      skipped: 1,
      errors: 0,
    });
    expect(runTenantMigrationDeployMock).not.toHaveBeenCalled();
  });

  it('skips a tenant whose credentials resolve to a deprovisioned timestamp', async () => {
    listActiveTenantsMock.mockResolvedValue([tenant('t1', 'acme')]);
    getTenantSanityWriteCredentialsMock.mockResolvedValue({
      ...credentials('t1'),
      deprovisionedAt: new Date('2026-01-02T00:00:00.000Z'),
    });

    const summary = await runMigration();

    expect(summary).toEqual({
      checked: 1,
      migrated: 0,
      backfilled: 0,
      skipped: 1,
      errors: 0,
    });
    expect(runTenantMigrationDeployMock).not.toHaveBeenCalled();
  });

  it("one tenant's failure does not abort the sweep for the rest", async () => {
    const tenants = [
      tenant('t1', 'acme'),
      tenant('t2', 'globex'),
      tenant('t3', 'initech'),
    ];
    listActiveTenantsMock.mockResolvedValue(tenants);
    runTenantMigrationDeployMock
      .mockImplementationOnce(() => undefined)
      .mockImplementationOnce(() => {
        throw new Error('migration deploy crashed');
      })
      .mockImplementationOnce(() => undefined);

    const summary = await runMigration();

    expect(summary).toEqual({
      checked: 3,
      migrated: 2,
      backfilled: 0,
      skipped: 0,
      errors: 1,
    });
    expect(runTenantMigrationDeployMock).toHaveBeenCalledTimes(3);
    expect(hasSystemicFailures(summary)).toBe(true);
  });

  it('counts a failed ledger read as an error for that tenant only', async () => {
    listActiveTenantsMock.mockResolvedValue([
      tenant('t1', 'acme'),
      tenant('t2', 'globex'),
    ]);
    isTenantMigrationLedgerEmptyMock
      .mockImplementationOnce(() => {
        throw new Error('sanity CLI crashed');
      })
      .mockImplementationOnce(() => false);

    const summary = await runMigration();

    expect(summary).toEqual({
      checked: 2,
      migrated: 1,
      backfilled: 0,
      skipped: 0,
      errors: 1,
    });
    expect(runTenantMigrationDeployMock).toHaveBeenCalledTimes(1);
  });
});

describe(runMigrationForTenant, () => {
  it('migrates only the given tenant', async () => {
    getTenantByIdMock.mockResolvedValue(tenant('t1', 'acme'));
    isTenantMigrationLedgerEmptyMock.mockReturnValue(false);

    const summary = await runMigrationForTenant('t1');

    expect(summary.checked).toBe(1);
    expect(getTenantByIdMock).toHaveBeenCalledWith('t1');
    expect(listActiveTenantsMock).not.toHaveBeenCalled();
  });

  it('returns an empty summary when the tenant id does not resolve', async () => {
    getTenantByIdMock.mockResolvedValue(undefined);

    const summary = await runMigrationForTenant('missing');

    expect(summary.checked).toBe(0);
    expect(runTenantMigrationDeployMock).not.toHaveBeenCalled();
  });
});

describe(hasSystemicFailures, () => {
  it('is false when every candidate resolved to an expected outcome', () => {
    expect(
      hasSystemicFailures({
        checked: 3,
        migrated: 2,
        backfilled: 1,
        skipped: 0,
        errors: 0,
      }),
    ).toBe(false);
  });

  it('is true when at least one candidate threw', () => {
    expect(
      hasSystemicFailures({
        checked: 3,
        migrated: 2,
        backfilled: 0,
        skipped: 0,
        errors: 1,
      }),
    ).toBe(true);
  });
});
