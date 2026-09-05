import { TENANT_PLAN, TENANT_STATUS } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { createTestDb } from '@blog/db/testing/create-test-db';
import { eq } from 'drizzle-orm';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

import { reportDeprovisioningStepStatus } from './report-deprovisioning-step-status';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

let db: PgliteDatabase<typeof schema>;

async function insertTenant(): Promise<string> {
  const [tenant] = await db
    .insert(schema.tenants)
    .values({
      name: 'Acme',
      primaryDomain: 'acme.example.com',
      locale: 'en',
      plan: TENANT_PLAN.FREE,
      status: TENANT_STATUS.ACTIVE,
      deprovisioningSteps: {
        REMOVE_DOMAIN: { status: 'IDLE' },
        ARCHIVE_SANITY_PROJECT: { status: 'IDLE' },
        REVOKE_SANITY_TOKENS: { status: 'IDLE' },
        CLEAR_ARTIFACTS: { status: 'IDLE' },
        ARCHIVE_TENANT: { status: 'IDLE' },
        INVALIDATE_TENANT_CACHE: { status: 'IDLE' },
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

describe(reportDeprovisioningStepStatus, () => {
  it('writes the step status directly to Postgres', async () => {
    const tenantId = await insertTenant();

    await reportDeprovisioningStepStatus({
      tenantId,
      step: 'REMOVE_DOMAIN',
      status: 'RUNNING',
    });

    const tenant = await loadTenant(tenantId);
    expect(tenant?.deprovisioningSteps).toMatchObject({
      REMOVE_DOMAIN: { status: 'RUNNING' },
    });
  });

  it('stores the error message only when supplied', async () => {
    const tenantId = await insertTenant();

    await reportDeprovisioningStepStatus({
      tenantId,
      step: 'ARCHIVE_SANITY_PROJECT',
      status: 'FAILED',
      error: 'Sanity Projects API returned 429',
    });

    const tenant = await loadTenant(tenantId);
    expect(tenant?.deprovisioningSteps).toMatchObject({
      ARCHIVE_SANITY_PROJECT: {
        status: 'FAILED',
        error: 'Sanity Projects API returned 429',
      },
    });
  });

  it('never throws when the tenant id does not exist — logs instead', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(
      reportDeprovisioningStepStatus({
        tenantId: '00000000-0000-0000-0000-000000000000',
        step: 'REMOVE_DOMAIN',
        status: 'RUNNING',
      }),
    ).resolves.toBeUndefined();

    expect(errorSpy).toHaveBeenCalledTimes(1);
  });
});
