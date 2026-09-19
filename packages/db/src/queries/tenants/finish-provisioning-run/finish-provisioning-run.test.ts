import { ERROR_CODE } from '@blog/config/constants';
import * as schema from '@blog/db/schema';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';

import { startProvisioningRun } from '../start-provisioning-run';

import { finishProvisioningRun } from './finish-provisioning-run';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);

const NOW = '2026-09-02T12:00:00.000Z';

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(NOW));
});

afterEach(async () => {
  await db().delete(schema.tenants);
  vi.useRealTimers();
});

describe(finishProvisioningRun, () => {
  it('merges finishedAt without clobbering startedAt/registry/workflowRunUrl', async () => {
    const tenant = await insertTestTenant(db());
    await startProvisioningRun({
      tenantId: tenant.id,
      registry: 'production',
      workflowRunUrl: 'https://github.com/acme/blog/actions/runs/123',
    });

    vi.setSystemTime(new Date('2026-09-02T12:05:00.000Z'));
    const result = await finishProvisioningRun({ tenantId: tenant.id });

    if (!result.ok) throw new Error('expected ok:true');
    expect(result.data.provisioningSteps?.run).toEqual({
      startedAt: NOW,
      registry: 'production',
      workflowRunUrl: 'https://github.com/acme/blog/actions/runs/123',
      finishedAt: '2026-09-02T12:05:00.000Z',
    });
  });

  it('sets finishedAt on an absent run rather than throwing', async () => {
    const tenant = await insertTestTenant(db());

    const result = await finishProvisioningRun({ tenantId: tenant.id });

    if (!result.ok) throw new Error('expected ok:true');
    expect(result.data.provisioningSteps?.run).toEqual({ finishedAt: NOW });
  });

  it('leaves every step entry untouched', async () => {
    const tenant = await insertTestTenant(db(), {
      provisioningSteps: {
        SANITY_PROJECT: { status: 'FAILED', error: 'boom' },
        SEED_CONTENT: { status: 'IDLE' },
        PERSIST_TOKEN: { status: 'IDLE' },
        MAP_DOMAIN: { status: 'IDLE' },
        CREATE_WEBHOOK: { status: 'IDLE' },
        VERIFY_CONTENT: { status: 'IDLE' },
        OWNER_ELEVATION: { status: 'IDLE' },
      },
    });

    const result = await finishProvisioningRun({ tenantId: tenant.id });

    if (!result.ok) throw new Error('expected ok:true');
    expect(result.data.provisioningSteps?.SANITY_PROJECT).toEqual({
      status: 'FAILED',
      error: 'boom',
    });
  });

  it('returns DB_NOT_FOUND for a tenant id that does not exist', async () => {
    const result = await finishProvisioningRun({
      tenantId: '00000000-0000-0000-0000-000000000000',
    });

    expect(result).toEqual({ ok: false, error: ERROR_CODE.DB_NOT_FOUND });
  });
});
