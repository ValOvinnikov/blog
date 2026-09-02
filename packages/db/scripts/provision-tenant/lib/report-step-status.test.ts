import { TENANT_PLAN, TENANT_STATUS } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { createTestDb } from '@blog/db/testing/create-test-db';
import { eq } from 'drizzle-orm';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

import { reportStepStatus } from './report-step-status';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

let db: PgliteDatabase<typeof schema>;

async function insertDraftTenant(): Promise<string> {
  const [tenant] = await db
    .insert(schema.tenants)
    .values({
      slug: 'acme',
      name: 'Acme',
      primaryDomain: 'acme.example.com',
      locale: 'en',
      plan: TENANT_PLAN.FREE,
      status: TENANT_STATUS.ACTIVE,
      provisioningStatus: 'PENDING',
      provisioningSteps: {
        SANITY_PROJECT: { status: 'IDLE' },
        SEED_CONTENT: { status: 'IDLE' },
        PERSIST_TOKEN: { status: 'IDLE' },
        MAP_DOMAIN: { status: 'IDLE' },
        CREATE_WEBHOOK: { status: 'IDLE' },
        OWNER_ELEVATION: { status: 'IDLE' },
      },
    })
    .returning();

  if (!tenant) throw new Error('setup: tenant insert returned no row.');

  return tenant.id;
}

async function loadTenant(tenantId: string) {
  const [tenant] = await db
    .select()
    .from(schema.tenants)
    .where(eq(schema.tenants.id, tenantId));

  return tenant;
}

beforeAll(async () => {
  db = await createTestDb();
}, 30_000);

beforeEach(() => {
  getDbMock.mockReturnValue(db);
});

afterEach(async () => {
  await db.delete(schema.tenants);
  vi.restoreAllMocks();
});

describe(reportStepStatus, () => {
  it('writes the step status directly to Postgres, with no HTTP call involved', async () => {
    const tenantId = await insertDraftTenant();

    await reportStepStatus({
      tenantId,
      step: 'SANITY_PROJECT',
      status: 'RUNNING',
    });

    const tenant = await loadTenant(tenantId);
    expect(tenant?.provisioningSteps).toMatchObject({
      SANITY_PROJECT: { status: 'RUNNING' },
    });
  });

  it('stores the error message only when supplied', async () => {
    const tenantId = await insertDraftTenant();

    await reportStepStatus({
      tenantId,
      step: 'SEED_CONTENT',
      status: 'FAILED',
      error: 'Sanity Projects API returned 429',
    });

    const tenant = await loadTenant(tenantId);
    expect(tenant?.provisioningSteps).toMatchObject({
      SEED_CONTENT: {
        status: 'FAILED',
        error: 'Sanity Projects API returned 429',
      },
    });
  });

  it('sets the overall provisioningStatus to READY when the last step finishes', async () => {
    const tenantId = await insertDraftTenant();

    await reportStepStatus({
      tenantId,
      step: 'CREATE_WEBHOOK',
      status: 'DONE',
    });

    const tenant = await loadTenant(tenantId);
    expect(tenant?.provisioningStatus).toBe('READY');
  });

  it('sets the overall provisioningStatus to FAILED when the last step fails', async () => {
    const tenantId = await insertDraftTenant();

    await reportStepStatus({
      tenantId,
      step: 'CREATE_WEBHOOK',
      status: 'FAILED',
      error: 'Webhook creation returned 500',
    });

    const tenant = await loadTenant(tenantId);
    expect(tenant?.provisioningStatus).toBe('FAILED');
  });

  it('leaves the overall provisioningStatus untouched for an earlier step', async () => {
    const tenantId = await insertDraftTenant();

    await reportStepStatus({
      tenantId,
      step: 'PERSIST_TOKEN',
      status: 'FAILED',
    });

    const tenant = await loadTenant(tenantId);
    expect(tenant?.provisioningStatus).toBe('PENDING');
  });

  it('writes lastNotifiedOwnerElevationOutcome only when supplied', async () => {
    const tenantId = await insertDraftTenant();

    await reportStepStatus({
      tenantId,
      step: 'OWNER_ELEVATION',
      status: 'DONE',
      detail: 'STALLED',
      notifiedOwnerElevationOutcome: 'STALLED',
    });

    const tenant = await loadTenant(tenantId);
    expect(tenant?.lastNotifiedOwnerElevationOutcome).toBe('STALLED');
  });

  it('never throws when the tenant id does not exist — logs instead', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(
      reportStepStatus({
        tenantId: '00000000-0000-0000-0000-000000000000',
        step: 'SANITY_PROJECT',
        status: 'RUNNING',
      }),
    ).resolves.toBeUndefined();

    expect(errorSpy).toHaveBeenCalledTimes(1);
  });
});
