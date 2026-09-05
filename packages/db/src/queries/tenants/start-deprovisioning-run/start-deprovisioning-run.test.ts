import { ERROR_CODE } from '@blog/config/constants';
import * as schema from '@blog/db/schema';
import { createTestDb } from '@blog/db/testing/create-test-db';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

import { startDeprovisioningRun } from './start-deprovisioning-run';

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

describe(startDeprovisioningRun, () => {
  it('writes startedAt and workflowRunUrl when supplied', async () => {
    const tenant = await insertTestTenant(db);

    const result = await startDeprovisioningRun({
      tenantId: tenant.id,
      workflowRunUrl: 'https://github.com/acme/blog/actions/runs/123',
    });

    if (!result.ok) throw new Error('expected ok:true');
    expect(result.data.deprovisioningSteps?.run).toEqual({
      startedAt: NOW,
      workflowRunUrl: 'https://github.com/acme/blog/actions/runs/123',
    });
  });

  it('omits workflowRunUrl entirely when not supplied', async () => {
    const tenant = await insertTestTenant(db);

    const result = await startDeprovisioningRun({ tenantId: tenant.id });

    if (!result.ok) throw new Error('expected ok:true');
    expect(result.data.deprovisioningSteps?.run).toEqual({ startedAt: NOW });
  });

  it('replaces a previous run wholesale rather than merging', async () => {
    const tenant = await insertTestTenant(db);

    await startDeprovisioningRun({
      tenantId: tenant.id,
      workflowRunUrl: 'https://github.com/acme/blog/actions/runs/1',
    });

    vi.setSystemTime(new Date('2026-09-02T13:00:00.000Z'));
    const result = await startDeprovisioningRun({ tenantId: tenant.id });

    if (!result.ok) throw new Error('expected ok:true');
    expect(result.data.deprovisioningSteps?.run).toEqual({
      startedAt: '2026-09-02T13:00:00.000Z',
    });
  });

  it('leaves every step entry untouched', async () => {
    const tenant = await insertTestTenant(db, {
      deprovisioningSteps: {
        REMOVE_DOMAIN: { status: 'DONE' },
        ARCHIVE_SANITY_PROJECT: { status: 'IDLE' },
        REVOKE_SANITY_TOKENS: { status: 'IDLE' },
        CLEAR_ARTIFACTS: { status: 'IDLE' },
        ARCHIVE_TENANT: { status: 'IDLE' },
        INVALIDATE_TENANT_CACHE: { status: 'IDLE' },
      },
    });

    const result = await startDeprovisioningRun({ tenantId: tenant.id });

    if (!result.ok) throw new Error('expected ok:true');
    expect(result.data.deprovisioningSteps?.REMOVE_DOMAIN).toEqual({
      status: 'DONE',
    });
  });

  it('returns DB_NOT_FOUND for a tenant id that does not exist', async () => {
    const result = await startDeprovisioningRun({
      tenantId: '00000000-0000-0000-0000-000000000000',
    });

    expect(result).toEqual({ ok: false, error: ERROR_CODE.DB_NOT_FOUND });
  });
});
