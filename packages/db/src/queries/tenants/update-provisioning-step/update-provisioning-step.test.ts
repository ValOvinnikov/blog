import { ERROR_CODE } from '@blog/config/constants';
import { TENANT_PLAN, TENANT_STATUS } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { createTestDb } from '@blog/db/testing/create-test-db';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

import { updateProvisioningStep } from './update-provisioning-step';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

let db: PgliteDatabase<typeof schema>;

async function insertDraftTenant(): Promise<string> {
  const [tenant] = await db
    .insert(schema.tenants)
    .values({
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

describe(updateProvisioningStep, () => {
  it('updates only the given step, leaving every other step untouched', async () => {
    const tenantId = await insertDraftTenant();

    const result = await updateProvisioningStep({
      tenantId,
      step: 'SANITY_PROJECT',
      status: 'RUNNING',
    });

    if (!result.ok) throw new Error('expected ok:true');
    expect(result.data.provisioningSteps).toEqual({
      SANITY_PROJECT: { status: 'RUNNING', updatedAt: NOW },
      SEED_CONTENT: { status: 'IDLE' },
      PERSIST_TOKEN: { status: 'IDLE' },
      MAP_DOMAIN: { status: 'IDLE' },
      CREATE_WEBHOOK: { status: 'IDLE' },
      OWNER_ELEVATION: { status: 'IDLE' },
    });
  });

  it('does not clobber a previously-updated step when a later step is updated', async () => {
    const tenantId = await insertDraftTenant();

    await updateProvisioningStep({
      tenantId,
      step: 'SANITY_PROJECT',
      status: 'DONE',
    });
    const result = await updateProvisioningStep({
      tenantId,
      step: 'SEED_CONTENT',
      status: 'RUNNING',
    });

    if (!result.ok) throw new Error('expected ok:true');
    expect(result.data.provisioningSteps).toEqual({
      SANITY_PROJECT: { status: 'DONE', updatedAt: NOW },
      SEED_CONTENT: { status: 'RUNNING', updatedAt: NOW },
      PERSIST_TOKEN: { status: 'IDLE' },
      MAP_DOMAIN: { status: 'IDLE' },
      CREATE_WEBHOOK: { status: 'IDLE' },
      OWNER_ELEVATION: { status: 'IDLE' },
    });
  });

  it('stores the error message only when one is supplied', async () => {
    const tenantId = await insertDraftTenant();

    const result = await updateProvisioningStep({
      tenantId,
      step: 'SANITY_PROJECT',
      status: 'FAILED',
      error: 'Sanity Projects API returned 429',
    });

    if (!result.ok) throw new Error('expected ok:true');
    expect(result.data.provisioningSteps?.['SANITY_PROJECT']).toEqual({
      status: 'FAILED',
      error: 'Sanity Projects API returned 429',
      updatedAt: NOW,
    });
  });

  it('stores the detail only when one is supplied', async () => {
    const tenantId = await insertDraftTenant();

    const result = await updateProvisioningStep({
      tenantId,
      step: 'OWNER_ELEVATION',
      status: 'DONE',
      detail: 'STALLED',
    });

    if (!result.ok) throw new Error('expected ok:true');
    expect(result.data.provisioningSteps?.['OWNER_ELEVATION']).toEqual({
      status: 'DONE',
      detail: 'STALLED',
      updatedAt: NOW,
    });
  });

  it('omits detail entirely when not supplied, leaving prior step state unaffected', async () => {
    const tenantId = await insertDraftTenant();

    const result = await updateProvisioningStep({
      tenantId,
      step: 'SANITY_PROJECT',
      status: 'DONE',
    });

    if (!result.ok) throw new Error('expected ok:true');
    expect(result.data.provisioningSteps?.['SANITY_PROJECT']).toEqual({
      status: 'DONE',
      updatedAt: NOW,
    });
  });

  it('leaves the overall provisioningStatus untouched when not supplied', async () => {
    const tenantId = await insertDraftTenant();

    const result = await updateProvisioningStep({
      tenantId,
      step: 'SANITY_PROJECT',
      status: 'DONE',
    });

    if (!result.ok) throw new Error('expected ok:true');
    expect(result.data.provisioningStatus).toBe('PENDING');
  });

  it('updates the overall provisioningStatus when supplied on the last step', async () => {
    const tenantId = await insertDraftTenant();

    const result = await updateProvisioningStep({
      tenantId,
      step: 'MAP_DOMAIN',
      status: 'DONE',
      provisioningStatus: 'READY',
    });

    if (!result.ok) throw new Error('expected ok:true');
    expect(result.data.provisioningStatus).toBe('READY');
    expect(result.data.provisioningSteps?.['MAP_DOMAIN']).toEqual({
      status: 'DONE',
      updatedAt: NOW,
    });
  });

  it('leaves lastNotifiedOwnerElevationOutcome untouched when not supplied', async () => {
    const tenantId = await insertDraftTenant();

    const result = await updateProvisioningStep({
      tenantId,
      step: 'OWNER_ELEVATION',
      status: 'DONE',
      detail: 'STALLED',
    });

    if (!result.ok) throw new Error('expected ok:true');
    expect(result.data.lastNotifiedOwnerElevationOutcome).toBeNull();
  });

  it('writes lastNotifiedOwnerElevationOutcome alongside the step detail when supplied', async () => {
    const tenantId = await insertDraftTenant();

    const result = await updateProvisioningStep({
      tenantId,
      step: 'OWNER_ELEVATION',
      status: 'DONE',
      detail: 'STALLED',
      notifiedOwnerElevationOutcome: 'STALLED',
    });

    if (!result.ok) throw new Error('expected ok:true');
    expect(result.data.lastNotifiedOwnerElevationOutcome).toBe('STALLED');
    expect(result.data.provisioningSteps?.['OWNER_ELEVATION']).toEqual({
      status: 'DONE',
      detail: 'STALLED',
      updatedAt: NOW,
    });
  });

  it('returns DB_NOT_FOUND for a tenant id that does not exist', async () => {
    const result = await updateProvisioningStep({
      tenantId: '00000000-0000-0000-0000-000000000000',
      step: 'SANITY_PROJECT',
      status: 'RUNNING',
    });

    expect(result).toEqual({ ok: false, error: ERROR_CODE.DB_NOT_FOUND });
  });
});
