import { ERROR_CODE } from '@blog/config/constants';
import { TENANT_PLAN, TENANT_STATUS } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { createTestDb } from '@blog/db/testing/create-test-db';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

import { updateDeprovisioningStep } from './update-deprovisioning-step';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

let db: PgliteDatabase<typeof schema>;

async function insertDeprovisioningTenant(): Promise<string> {
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

describe(updateDeprovisioningStep, () => {
  it('updates only the given step, leaving every other step untouched', async () => {
    const tenantId = await insertDeprovisioningTenant();

    const result = await updateDeprovisioningStep({
      tenantId,
      step: 'REMOVE_DOMAIN',
      status: 'RUNNING',
    });

    if (!result.ok) throw new Error('expected ok:true');
    expect(result.data.deprovisioningSteps).toEqual({
      REMOVE_DOMAIN: { status: 'RUNNING', updatedAt: NOW },
      ARCHIVE_SANITY_PROJECT: { status: 'IDLE' },
      REVOKE_SANITY_TOKENS: { status: 'IDLE' },
      CLEAR_ARTIFACTS: { status: 'IDLE' },
      ARCHIVE_TENANT: { status: 'IDLE' },
      INVALIDATE_TENANT_CACHE: { status: 'IDLE' },
    });
  });

  it('does not clobber a previously-updated step when a later step is updated', async () => {
    const tenantId = await insertDeprovisioningTenant();

    await updateDeprovisioningStep({
      tenantId,
      step: 'REMOVE_DOMAIN',
      status: 'DONE',
    });
    const result = await updateDeprovisioningStep({
      tenantId,
      step: 'ARCHIVE_SANITY_PROJECT',
      status: 'RUNNING',
    });

    if (!result.ok) throw new Error('expected ok:true');
    expect(result.data.deprovisioningSteps).toEqual({
      REMOVE_DOMAIN: { status: 'DONE', updatedAt: NOW },
      ARCHIVE_SANITY_PROJECT: { status: 'RUNNING', updatedAt: NOW },
      REVOKE_SANITY_TOKENS: { status: 'IDLE' },
      CLEAR_ARTIFACTS: { status: 'IDLE' },
      ARCHIVE_TENANT: { status: 'IDLE' },
      INVALIDATE_TENANT_CACHE: { status: 'IDLE' },
    });
  });

  it('stores the error message only when one is supplied', async () => {
    const tenantId = await insertDeprovisioningTenant();

    const result = await updateDeprovisioningStep({
      tenantId,
      step: 'ARCHIVE_SANITY_PROJECT',
      status: 'FAILED',
      error: 'Sanity Projects API returned 429',
    });

    if (!result.ok) throw new Error('expected ok:true');
    expect(result.data.deprovisioningSteps?.['ARCHIVE_SANITY_PROJECT']).toEqual(
      {
        status: 'FAILED',
        error: 'Sanity Projects API returned 429',
        updatedAt: NOW,
      },
    );
  });

  it('omits error entirely when not supplied', async () => {
    const tenantId = await insertDeprovisioningTenant();

    const result = await updateDeprovisioningStep({
      tenantId,
      step: 'REMOVE_DOMAIN',
      status: 'DONE',
    });

    if (!result.ok) throw new Error('expected ok:true');
    expect(result.data.deprovisioningSteps?.['REMOVE_DOMAIN']).toEqual({
      status: 'DONE',
      updatedAt: NOW,
    });
  });

  it('returns DB_NOT_FOUND for a tenant id that does not exist', async () => {
    const result = await updateDeprovisioningStep({
      tenantId: '00000000-0000-0000-0000-000000000000',
      step: 'REMOVE_DOMAIN',
      status: 'RUNNING',
    });

    expect(result).toEqual({ ok: false, error: ERROR_CODE.DB_NOT_FOUND });
  });
});
