import { ERROR_CODE } from '@blog/config/constants';
import * as schema from '@blog/db/schema';
import { createTestDb } from '@blog/db/testing/create-test-db';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

import { startDeprovisioningRun } from '../start-deprovisioning-run';

import { finishDeprovisioningRun } from './finish-deprovisioning-run';

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

describe(finishDeprovisioningRun, () => {
  it('merges finishedAt without clobbering startedAt/workflowRunUrl', async () => {
    const tenant = await insertTestTenant(db);
    await startDeprovisioningRun({
      tenantId: tenant.id,
      workflowRunUrl: 'https://github.com/acme/blog/actions/runs/123',
    });

    vi.setSystemTime(new Date('2026-09-02T12:05:00.000Z'));
    const result = await finishDeprovisioningRun({ tenantId: tenant.id });

    if (!result.ok) throw new Error('expected ok:true');
    expect(result.data.deprovisioningSteps?.run).toEqual({
      startedAt: NOW,
      workflowRunUrl: 'https://github.com/acme/blog/actions/runs/123',
      finishedAt: '2026-09-02T12:05:00.000Z',
    });
  });

  it('sets finishedAt on an absent run rather than throwing', async () => {
    const tenant = await insertTestTenant(db);

    const result = await finishDeprovisioningRun({ tenantId: tenant.id });

    if (!result.ok) throw new Error('expected ok:true');
    expect(result.data.deprovisioningSteps?.run).toEqual({ finishedAt: NOW });
  });

  it('leaves every step entry untouched', async () => {
    const tenant = await insertTestTenant(db, {
      deprovisioningSteps: {
        REMOVE_DOMAIN: { status: 'FAILED', error: 'boom' },
        ARCHIVE_SANITY_PROJECT: { status: 'IDLE' },
        REVOKE_SANITY_TOKENS: { status: 'IDLE' },
        CLEAR_ARTIFACTS: { status: 'IDLE' },
        ARCHIVE_TENANT: { status: 'IDLE' },
        INVALIDATE_TENANT_CACHE: { status: 'IDLE' },
      },
    });

    const result = await finishDeprovisioningRun({ tenantId: tenant.id });

    if (!result.ok) throw new Error('expected ok:true');
    expect(result.data.deprovisioningSteps?.REMOVE_DOMAIN).toEqual({
      status: 'FAILED',
      error: 'boom',
    });
  });

  it('returns DB_NOT_FOUND for a tenant id that does not exist', async () => {
    const result = await finishDeprovisioningRun({
      tenantId: '00000000-0000-0000-0000-000000000000',
    });

    expect(result).toEqual({ ok: false, error: ERROR_CODE.DB_NOT_FOUND });
  });
});
