import { ERROR_CODE } from '@blog/config/constants';
import {
  TENANT_PROVISIONING_RETRY_DEBOUNCE_MINUTES,
  TENANT_PROVISIONING_RUN_STALE_AFTER_MINUTES,
  TENANT_PROVISIONING_STATUS,
} from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import {
  tenants,
  type TTenantProvisioningState,
} from '@blog/db/schema/tenants';
import { createTestDb } from '@blog/db/testing/create-test-db';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { eq, sql } from 'drizzle-orm';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

import { setTenantProvisioningStatus } from '../set-tenant-provisioning-status';

import { beginTenantProvisioning } from './begin-tenant-provisioning';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

let db: PgliteDatabase<typeof schema>;

function minutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

// Older than the debounce but well within the long staleness backstop — the
// shape of a genuinely wedged run's `startedAt`, not a run still within its
// own dispatch round-trip.
const WEDGED_STARTED_AT = minutesAgo(
  TENANT_PROVISIONING_RETRY_DEBOUNCE_MINUTES + 1,
);

async function insertTenant(overrides?: {
  provisioningStatus?: (typeof TENANT_PROVISIONING_STATUS)[keyof typeof TENANT_PROVISIONING_STATUS];
}): Promise<string> {
  const tenant = await insertTestTenant(db, {
    slug: 'acme',
    provisioningStatus: overrides?.provisioningStatus,
  });

  return tenant.id;
}

beforeAll(async () => {
  db = await createTestDb();
}, 30_000);

beforeEach(() => {
  getDbMock.mockReturnValue(db);
});

afterEach(async () => {
  await db.delete(schema.tenants);
});

describe(beginTenantProvisioning, () => {
  it('moves a tenant with no provisioningStatus (NULL) to PROVISIONING', async () => {
    const tenantId = await insertTenant();

    const result = await beginTenantProvisioning(tenantId);

    if (!result.ok) throw new Error('expected ok:true');
    expect(result.data.tenant.provisioningStatus).toBe(
      TENANT_PROVISIONING_STATUS.PROVISIONING,
    );
    expect(result.data.previousProvisioningStatus).toBeNull();
  });

  it('moves a PENDING tenant to PROVISIONING and reports the prior status', async () => {
    const tenantId = await insertTenant({
      provisioningStatus: TENANT_PROVISIONING_STATUS.PENDING,
    });

    const result = await beginTenantProvisioning(tenantId);

    if (!result.ok) throw new Error('expected ok:true');
    expect(result.data.tenant.provisioningStatus).toBe(
      TENANT_PROVISIONING_STATUS.PROVISIONING,
    );
    expect(result.data.previousProvisioningStatus).toBe(
      TENANT_PROVISIONING_STATUS.PENDING,
    );
  });

  it('moves a FAILED tenant to PROVISIONING (a retry), reporting FAILED as the prior status', async () => {
    const tenantId = await insertTenant({
      provisioningStatus: TENANT_PROVISIONING_STATUS.FAILED,
    });

    const result = await beginTenantProvisioning(tenantId);

    if (!result.ok) throw new Error('expected ok:true');
    expect(result.data.tenant.provisioningStatus).toBe(
      TENANT_PROVISIONING_STATUS.PROVISIONING,
    );
    expect(result.data.previousProvisioningStatus).toBe(
      TENANT_PROVISIONING_STATUS.FAILED,
    );
  });

  it('refuses with DB_ALREADY_PROVISIONING and leaves the row untouched when already PROVISIONING', async () => {
    const tenantId = await insertTenant({
      provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
    });

    const result = await beginTenantProvisioning(tenantId);

    expect(result).toEqual({
      ok: false,
      error: ERROR_CODE.DB_ALREADY_PROVISIONING,
    });

    const [row] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId));
    expect(row?.provisioningStatus).toBe(
      TENANT_PROVISIONING_STATUS.PROVISIONING,
    );
  });

  it('resolves exactly one of two concurrent calls with ok:true', async () => {
    const tenantId = await insertTenant();

    const [first, second] = await Promise.all([
      beginTenantProvisioning(tenantId),
      beginTenantProvisioning(tenantId),
    ]);

    const outcomes = [first, second];
    const succeeded = outcomes.filter((result) => result.ok);
    const refused = outcomes.filter((result) => !result.ok);

    expect(succeeded).toHaveLength(1);
    expect(refused).toHaveLength(1);
    expect(refused[0]).toEqual({
      ok: false,
      error: ERROR_CODE.DB_ALREADY_PROVISIONING,
    });

    const [row] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId));
    expect(row?.provisioningStatus).toBe(
      TENANT_PROVISIONING_STATUS.PROVISIONING,
    );
  });

  it('admits a PROVISIONING tenant wedged with a FAILED step whose updatedAt matches run.startedAt, preserving the step error text', async () => {
    const provisioningSteps: TTenantProvisioningState = {
      SANITY_PROJECT: { status: 'DONE' },
      SEED_CONTENT: {
        status: 'FAILED',
        error: 'boom',
        updatedAt: WEDGED_STARTED_AT,
      },
      PERSIST_TOKEN: { status: 'IDLE' },
      MAP_DOMAIN: { status: 'IDLE' },
      CREATE_WEBHOOK: { status: 'IDLE' },
      OWNER_ELEVATION: { status: 'IDLE' },
      run: { startedAt: WEDGED_STARTED_AT },
    };
    const tenant = await insertTestTenant(db, {
      provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
      provisioningSteps,
    });

    const result = await beginTenantProvisioning(tenant.id);

    if (!result.ok) throw new Error('expected ok:true');
    expect(result.data.tenant.provisioningStatus).toBe(
      TENANT_PROVISIONING_STATUS.PROVISIONING,
    );
    expect(result.data.previousProvisioningStatus).toBe(
      TENANT_PROVISIONING_STATUS.PROVISIONING,
    );
    expect(result.data.tenant.provisioningSteps?.SEED_CONTENT).toEqual({
      status: 'FAILED',
      error: 'boom',
      updatedAt: WEDGED_STARTED_AT,
    });
    expect(result.data.tenant.provisioningSteps?.run?.startedAt).toBe(
      WEDGED_STARTED_AT,
    );
  });

  it('refuses a genuinely live run carrying a stale FAILED step whose updatedAt predates run.startedAt', async () => {
    const staleUpdatedAt = minutesAgo(
      TENANT_PROVISIONING_RETRY_DEBOUNCE_MINUTES + 6,
    );
    const provisioningSteps: TTenantProvisioningState = {
      SANITY_PROJECT: { status: 'DONE' },
      SEED_CONTENT: {
        status: 'FAILED',
        error: 'boom from an earlier attempt',
        updatedAt: staleUpdatedAt,
      },
      PERSIST_TOKEN: { status: 'RUNNING' },
      MAP_DOMAIN: { status: 'IDLE' },
      CREATE_WEBHOOK: { status: 'IDLE' },
      OWNER_ELEVATION: { status: 'IDLE' },
      run: { startedAt: WEDGED_STARTED_AT },
    };
    const tenant = await insertTestTenant(db, {
      provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
      provisioningSteps,
    });

    const result = await beginTenantProvisioning(tenant.id);

    expect(result).toEqual({
      ok: false,
      error: ERROR_CODE.DB_ALREADY_PROVISIONING,
    });

    const [row] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenant.id));
    expect(row?.provisioningStatus).toBe(
      TENANT_PROVISIONING_STATUS.PROVISIONING,
    );
  });

  it('admits a PROVISIONING tenant whose run recorded finishedAt, past the debounce', async () => {
    const provisioningSteps: TTenantProvisioningState = {
      SANITY_PROJECT: { status: 'DONE' },
      SEED_CONTENT: { status: 'DONE' },
      PERSIST_TOKEN: { status: 'DONE' },
      MAP_DOMAIN: { status: 'DONE' },
      CREATE_WEBHOOK: { status: 'DONE' },
      OWNER_ELEVATION: { status: 'IDLE' },
      run: {
        startedAt: WEDGED_STARTED_AT,
        finishedAt: minutesAgo(TENANT_PROVISIONING_RETRY_DEBOUNCE_MINUTES),
      },
    };
    const tenant = await insertTestTenant(db, {
      provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
      provisioningSteps,
    });

    const result = await beginTenantProvisioning(tenant.id);

    if (!result.ok) throw new Error('expected ok:true');
    expect(result.data.tenant.provisioningStatus).toBe(
      TENANT_PROVISIONING_STATUS.PROVISIONING,
    );
  });

  it('admits a PROVISIONING tenant whose run.startedAt is older than the staleness backstop, with no FAILED step and no finishedAt', async () => {
    const staleStartedAt = minutesAgo(
      TENANT_PROVISIONING_RUN_STALE_AFTER_MINUTES + 1,
    );
    const provisioningSteps: TTenantProvisioningState = {
      SANITY_PROJECT: { status: 'DONE' },
      SEED_CONTENT: { status: 'RUNNING' },
      PERSIST_TOKEN: { status: 'IDLE' },
      MAP_DOMAIN: { status: 'IDLE' },
      CREATE_WEBHOOK: { status: 'IDLE' },
      OWNER_ELEVATION: { status: 'IDLE' },
      run: { startedAt: staleStartedAt },
    };
    const tenant = await insertTestTenant(db, {
      provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
      provisioningSteps,
    });

    const result = await beginTenantProvisioning(tenant.id);

    if (!result.ok) throw new Error('expected ok:true');
    expect(result.data.tenant.provisioningStatus).toBe(
      TENANT_PROVISIONING_STATUS.PROVISIONING,
    );
  });

  it('refuses a genuinely live PROVISIONING run (recent startedAt, no FAILED step, no finishedAt)', async () => {
    const provisioningSteps: TTenantProvisioningState = {
      SANITY_PROJECT: { status: 'DONE' },
      SEED_CONTENT: { status: 'RUNNING' },
      PERSIST_TOKEN: { status: 'IDLE' },
      MAP_DOMAIN: { status: 'IDLE' },
      CREATE_WEBHOOK: { status: 'IDLE' },
      OWNER_ELEVATION: { status: 'IDLE' },
      run: { startedAt: new Date().toISOString() },
    };
    const tenant = await insertTestTenant(db, {
      provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
      provisioningSteps,
    });

    const result = await beginTenantProvisioning(tenant.id);

    expect(result).toEqual({
      ok: false,
      error: ERROR_CODE.DB_ALREADY_PROVISIONING,
    });

    const [row] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenant.id));
    expect(row?.provisioningStatus).toBe(
      TENANT_PROVISIONING_STATUS.PROVISIONING,
    );
  });

  it('refuses immediately after a reverted dispatch failure, then admits again once the debounce has elapsed, preserving the FAILED step', async () => {
    const provisioningSteps: TTenantProvisioningState = {
      SANITY_PROJECT: { status: 'DONE' },
      SEED_CONTENT: {
        status: 'FAILED',
        error: 'boom',
        updatedAt: WEDGED_STARTED_AT,
      },
      PERSIST_TOKEN: { status: 'IDLE' },
      MAP_DOMAIN: { status: 'IDLE' },
      CREATE_WEBHOOK: { status: 'IDLE' },
      OWNER_ELEVATION: { status: 'IDLE' },
      run: { startedAt: WEDGED_STARTED_AT },
    };
    const tenant = await insertTestTenant(db, {
      provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
      provisioningSteps,
    });

    const firstAttempt = await beginTenantProvisioning(tenant.id);
    if (!firstAttempt.ok) throw new Error('expected ok:true');

    const reverted = await setTenantProvisioningStatus(
      tenant.id,
      firstAttempt.data.previousProvisioningStatus,
    );
    if (!reverted.ok) throw new Error('expected revert ok:true');

    const immediateRetry = await beginTenantProvisioning(tenant.id);
    expect(immediateRetry).toEqual({
      ok: false,
      error: ERROR_CODE.DB_ALREADY_PROVISIONING,
    });

    const debouncedAdmittedAt = minutesAgo(
      TENANT_PROVISIONING_RETRY_DEBOUNCE_MINUTES + 1,
    );
    await db
      .update(tenants)
      .set({
        provisioningSteps: sql`jsonb_set(
          ${tenants.provisioningSteps},
          array['run','admittedAt']::text[],
          ${JSON.stringify(debouncedAdmittedAt)}::jsonb
        )`,
      })
      .where(eq(tenants.id, tenant.id));

    const delayedRetry = await beginTenantProvisioning(tenant.id);

    if (!delayedRetry.ok) throw new Error('expected ok:true');
    expect(delayedRetry.data.tenant.provisioningStatus).toBe(
      TENANT_PROVISIONING_STATUS.PROVISIONING,
    );
    expect(delayedRetry.data.tenant.provisioningSteps?.SEED_CONTENT).toEqual({
      status: 'FAILED',
      error: 'boom',
      updatedAt: WEDGED_STARTED_AT,
    });
    expect(delayedRetry.data.tenant.provisioningSteps?.run?.startedAt).toBe(
      WEDGED_STARTED_AT,
    );
  });

  it('resolves exactly one of two near-simultaneous calls on a wedged tenant', async () => {
    const provisioningSteps: TTenantProvisioningState = {
      SANITY_PROJECT: { status: 'DONE' },
      SEED_CONTENT: {
        status: 'FAILED',
        error: 'boom',
        updatedAt: WEDGED_STARTED_AT,
      },
      PERSIST_TOKEN: { status: 'IDLE' },
      MAP_DOMAIN: { status: 'IDLE' },
      CREATE_WEBHOOK: { status: 'IDLE' },
      OWNER_ELEVATION: { status: 'IDLE' },
      run: { startedAt: WEDGED_STARTED_AT },
    };
    const tenant = await insertTestTenant(db, {
      provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
      provisioningSteps,
    });

    const [first, second] = await Promise.all([
      beginTenantProvisioning(tenant.id),
      beginTenantProvisioning(tenant.id),
    ]);

    const outcomes = [first, second];
    const succeeded = outcomes.filter((result) => result.ok);
    const refused = outcomes.filter((result) => !result.ok);

    expect(succeeded).toHaveLength(1);
    expect(refused).toHaveLength(1);
    expect(refused[0]).toEqual({
      ok: false,
      error: ERROR_CODE.DB_ALREADY_PROVISIONING,
    });

    const [row] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenant.id));
    expect(row?.provisioningStatus).toBe(
      TENANT_PROVISIONING_STATUS.PROVISIONING,
    );
  });

  it('returns DB_NOT_FOUND for a tenant id that does not exist', async () => {
    const result = await beginTenantProvisioning(
      '00000000-0000-0000-0000-000000000000',
    );

    expect(result).toEqual({ ok: false, error: ERROR_CODE.DB_NOT_FOUND });
  });
});
