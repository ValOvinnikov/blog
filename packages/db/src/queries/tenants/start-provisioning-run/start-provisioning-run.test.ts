import { ERROR_CODE } from '@blog/config/constants';
import * as schema from '@blog/db/schema';
import { createTestDb } from '@blog/db/testing/create-test-db';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

import { startProvisioningRun } from './start-provisioning-run';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

let db: PgliteDatabase<typeof schema>;

const NOW = '2026-09-02T12:00:00.000Z';

beforeAll(async () => {
  db = await createTestDb();
}, 30_000);

beforeEach(() => {
  getDbMock.mockReturnValue(db);
  vi.useFakeTimers();
  vi.setSystemTime(new Date(NOW));
});

afterEach(async () => {
  await db.delete(schema.tenants);
  vi.useRealTimers();
});

describe(startProvisioningRun, () => {
  it('writes startedAt, registry, and workflowRunUrl when all are supplied', async () => {
    const tenant = await insertTestTenant(db);

    const result = await startProvisioningRun({
      tenantId: tenant.id,
      registry: 'production',
      workflowRunUrl: 'https://github.com/acme/blog/actions/runs/123',
    });

    if (!result.ok) throw new Error('expected ok:true');
    expect(result.data.provisioningSteps?.run).toEqual({
      startedAt: NOW,
      registry: 'production',
      workflowRunUrl: 'https://github.com/acme/blog/actions/runs/123',
    });
  });

  it('omits registry and workflowRunUrl entirely when not supplied', async () => {
    const tenant = await insertTestTenant(db);

    const result = await startProvisioningRun({ tenantId: tenant.id });

    if (!result.ok) throw new Error('expected ok:true');
    expect(result.data.provisioningSteps?.run).toEqual({ startedAt: NOW });
  });

  it('replaces a previous run wholesale rather than merging', async () => {
    const tenant = await insertTestTenant(db);

    await startProvisioningRun({
      tenantId: tenant.id,
      registry: 'development',
      workflowRunUrl: 'https://github.com/acme/blog/actions/runs/1',
    });

    vi.setSystemTime(new Date('2026-09-02T13:00:00.000Z'));
    const result = await startProvisioningRun({ tenantId: tenant.id });

    if (!result.ok) throw new Error('expected ok:true');
    expect(result.data.provisioningSteps?.run).toEqual({
      startedAt: '2026-09-02T13:00:00.000Z',
    });
  });

  it('leaves every step entry untouched', async () => {
    const tenant = await insertTestTenant(db, {
      provisioningSteps: {
        SANITY_PROJECT: { status: 'DONE' },
        SEED_CONTENT: { status: 'IDLE' },
        PERSIST_TOKEN: { status: 'IDLE' },
        MAP_DOMAIN: { status: 'IDLE' },
        CREATE_WEBHOOK: { status: 'IDLE' },
        OWNER_ELEVATION: { status: 'IDLE' },
      },
    });

    const result = await startProvisioningRun({ tenantId: tenant.id });

    if (!result.ok) throw new Error('expected ok:true');
    expect(result.data.provisioningSteps?.SANITY_PROJECT).toEqual({
      status: 'DONE',
    });
  });

  it('returns DB_NOT_FOUND for a tenant id that does not exist', async () => {
    const result = await startProvisioningRun({
      tenantId: '00000000-0000-0000-0000-000000000000',
    });

    expect(result).toEqual({ ok: false, error: ERROR_CODE.DB_NOT_FOUND });
  });
});
