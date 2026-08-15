import { TENANT_PLAN, TENANT_STATUS } from '@blog/config/constants';
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
      slug: 'acme',
      name: 'Acme',
      primaryDomain: 'acme.example.com',
      locale: 'en',
      plan: TENANT_PLAN.FREE,
      status: TENANT_STATUS.ACTIVE,
      provisioningStatus: 'PENDING',
      provisioningSteps: {
        SANITY_PROJECT: { status: 'idle' },
        SEED_CONTENT: { status: 'idle' },
        DEPLOY_STUDIO: { status: 'idle' },
        PERSIST_TOKEN: { status: 'idle' },
        MAP_DOMAIN: { status: 'idle' },
      },
    })
    .returning();

  if (!tenant) throw new Error('setup: tenant insert returned no row.');

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

describe(updateProvisioningStep, () => {
  it('updates only the given step, leaving every other step untouched', async () => {
    const tenantId = await insertDraftTenant();

    const tenant = await updateProvisioningStep({
      tenantId,
      step: 'SANITY_PROJECT',
      status: 'running',
    });

    expect(tenant.provisioningSteps).toEqual({
      SANITY_PROJECT: { status: 'running' },
      SEED_CONTENT: { status: 'idle' },
      DEPLOY_STUDIO: { status: 'idle' },
      PERSIST_TOKEN: { status: 'idle' },
      MAP_DOMAIN: { status: 'idle' },
    });
  });

  it('does not clobber a previously-updated step when a later step is updated', async () => {
    const tenantId = await insertDraftTenant();

    await updateProvisioningStep({
      tenantId,
      step: 'SANITY_PROJECT',
      status: 'done',
    });
    const tenant = await updateProvisioningStep({
      tenantId,
      step: 'SEED_CONTENT',
      status: 'running',
    });

    expect(tenant.provisioningSteps).toEqual({
      SANITY_PROJECT: { status: 'done' },
      SEED_CONTENT: { status: 'running' },
      DEPLOY_STUDIO: { status: 'idle' },
      PERSIST_TOKEN: { status: 'idle' },
      MAP_DOMAIN: { status: 'idle' },
    });
  });

  it('stores the error message only when one is supplied', async () => {
    const tenantId = await insertDraftTenant();

    const tenant = await updateProvisioningStep({
      tenantId,
      step: 'SANITY_PROJECT',
      status: 'failed',
      error: 'Sanity Projects API returned 429',
    });

    expect(tenant.provisioningSteps?.['SANITY_PROJECT']).toEqual({
      status: 'failed',
      error: 'Sanity Projects API returned 429',
    });
  });

  it('leaves the overall provisioningStatus untouched when not supplied', async () => {
    const tenantId = await insertDraftTenant();

    const tenant = await updateProvisioningStep({
      tenantId,
      step: 'SANITY_PROJECT',
      status: 'done',
    });

    expect(tenant.provisioningStatus).toBe('PENDING');
  });

  it('updates the overall provisioningStatus when supplied on the last step', async () => {
    const tenantId = await insertDraftTenant();

    const tenant = await updateProvisioningStep({
      tenantId,
      step: 'MAP_DOMAIN',
      status: 'done',
      provisioningStatus: 'READY',
    });

    expect(tenant.provisioningStatus).toBe('READY');
    expect(tenant.provisioningSteps?.['MAP_DOMAIN']).toEqual({
      status: 'done',
    });
  });

  it('rejects for a tenant id that does not exist', async () => {
    await expect(
      updateProvisioningStep({
        tenantId: '00000000-0000-0000-0000-000000000000',
        step: 'SANITY_PROJECT',
        status: 'running',
      }),
    ).rejects.toThrow();
  });
});
