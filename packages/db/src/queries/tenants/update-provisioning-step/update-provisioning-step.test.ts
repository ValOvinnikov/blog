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
        SANITY_PROJECT: { status: 'IDLE' },
        SEED_CONTENT: { status: 'IDLE' },
        DEPLOY_STUDIO: { status: 'IDLE' },
        PERSIST_TOKEN: { status: 'IDLE' },
        MAP_DOMAIN: { status: 'IDLE' },
        CREATE_WEBHOOK: { status: 'IDLE' },
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
      status: 'RUNNING',
    });

    expect(tenant.provisioningSteps).toEqual({
      SANITY_PROJECT: { status: 'RUNNING' },
      SEED_CONTENT: { status: 'IDLE' },
      DEPLOY_STUDIO: { status: 'IDLE' },
      PERSIST_TOKEN: { status: 'IDLE' },
      MAP_DOMAIN: { status: 'IDLE' },
      CREATE_WEBHOOK: { status: 'IDLE' },
    });
  });

  it('does not clobber a previously-updated step when a later step is updated', async () => {
    const tenantId = await insertDraftTenant();

    await updateProvisioningStep({
      tenantId,
      step: 'SANITY_PROJECT',
      status: 'DONE',
    });
    const tenant = await updateProvisioningStep({
      tenantId,
      step: 'SEED_CONTENT',
      status: 'RUNNING',
    });

    expect(tenant.provisioningSteps).toEqual({
      SANITY_PROJECT: { status: 'DONE' },
      SEED_CONTENT: { status: 'RUNNING' },
      DEPLOY_STUDIO: { status: 'IDLE' },
      PERSIST_TOKEN: { status: 'IDLE' },
      MAP_DOMAIN: { status: 'IDLE' },
      CREATE_WEBHOOK: { status: 'IDLE' },
    });
  });

  it('stores the error message only when one is supplied', async () => {
    const tenantId = await insertDraftTenant();

    const tenant = await updateProvisioningStep({
      tenantId,
      step: 'SANITY_PROJECT',
      status: 'FAILED',
      error: 'Sanity Projects API returned 429',
    });

    expect(tenant.provisioningSteps?.['SANITY_PROJECT']).toEqual({
      status: 'FAILED',
      error: 'Sanity Projects API returned 429',
    });
  });

  it('leaves the overall provisioningStatus untouched when not supplied', async () => {
    const tenantId = await insertDraftTenant();

    const tenant = await updateProvisioningStep({
      tenantId,
      step: 'SANITY_PROJECT',
      status: 'DONE',
    });

    expect(tenant.provisioningStatus).toBe('PENDING');
  });

  it('updates the overall provisioningStatus when supplied on the last step', async () => {
    const tenantId = await insertDraftTenant();

    const tenant = await updateProvisioningStep({
      tenantId,
      step: 'MAP_DOMAIN',
      status: 'DONE',
      provisioningStatus: 'READY',
    });

    expect(tenant.provisioningStatus).toBe('READY');
    expect(tenant.provisioningSteps?.['MAP_DOMAIN']).toEqual({
      status: 'DONE',
    });
  });

  it('rejects for a tenant id that does not exist', async () => {
    await expect(
      updateProvisioningStep({
        tenantId: '00000000-0000-0000-0000-000000000000',
        step: 'SANITY_PROJECT',
        status: 'RUNNING',
      }),
    ).rejects.toThrow();
  });
});
