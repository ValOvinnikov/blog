import { TENANT_PLAN, TENANT_STATUS } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { createTestDb } from '@blog/db/testing/create-test-db';
import { eq } from 'drizzle-orm';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

import {
  reportDeprovisioningRunFinish,
  reportDeprovisioningRunStart,
} from './report-deprovisioning-run';

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

describe(reportDeprovisioningRunStart, () => {
  it('writes the run start directly to Postgres', async () => {
    const tenantId = await insertTenant();

    await reportDeprovisioningRunStart({
      tenantId,
      workflowRunUrl: 'https://github.com/acme/blog/actions/runs/123',
    });

    const tenant = await loadTenant(tenantId);
    expect(tenant?.deprovisioningSteps?.run).toMatchObject({
      workflowRunUrl: 'https://github.com/acme/blog/actions/runs/123',
    });
  });

  it('never throws when the tenant id does not exist — logs instead', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(
      reportDeprovisioningRunStart({
        tenantId: '00000000-0000-0000-0000-000000000000',
      }),
    ).resolves.toBeUndefined();

    expect(errorSpy).toHaveBeenCalledTimes(1);
  });
});

describe(reportDeprovisioningRunFinish, () => {
  it('writes the run finish directly to Postgres', async () => {
    const tenantId = await insertTenant();
    await reportDeprovisioningRunStart({ tenantId });

    await reportDeprovisioningRunFinish(tenantId);

    const tenant = await loadTenant(tenantId);
    expect(tenant?.deprovisioningSteps?.run?.finishedAt).toEqual(
      expect.any(String),
    );
  });

  it('never throws when the tenant id does not exist — logs instead', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(
      reportDeprovisioningRunFinish('00000000-0000-0000-0000-000000000000'),
    ).resolves.toBeUndefined();

    expect(errorSpy).toHaveBeenCalledTimes(1);
  });
});
