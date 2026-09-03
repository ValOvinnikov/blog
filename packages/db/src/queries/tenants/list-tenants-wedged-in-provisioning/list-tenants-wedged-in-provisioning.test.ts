import { TENANT_PROVISIONING_STATUS } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { createTestDb } from '@blog/db/testing/create-test-db';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

import { listTenantsWedgedInProvisioning } from './list-tenants-wedged-in-provisioning';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

let db: PgliteDatabase<typeof schema>;

beforeAll(async () => {
  db = await createTestDb();
}, 30_000);

beforeEach(() => {
  getDbMock.mockReturnValue(db);
});

afterEach(async () => {
  await db.delete(schema.tenants);
});

describe(listTenantsWedgedInProvisioning, () => {
  it('includes a PROVISIONING tenant with a FAILED step', async () => {
    const tenant = await insertTestTenant(db, {
      provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
      provisioningSteps: {
        SANITY_PROJECT: { status: 'DONE' },
        SEED_CONTENT: { status: 'FAILED', error: 'boom' },
        PERSIST_TOKEN: { status: 'IDLE' },
        MAP_DOMAIN: { status: 'IDLE' },
        CREATE_WEBHOOK: { status: 'IDLE' },
        OWNER_ELEVATION: { status: 'IDLE' },
      },
    });

    const result = await listTenantsWedgedInProvisioning();

    expect(result.map((row) => row.id)).toEqual([tenant.id]);
  });

  it('excludes a PROVISIONING tenant with no FAILED step (a genuine in-flight run)', async () => {
    await insertTestTenant(db, {
      provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
      provisioningSteps: {
        SANITY_PROJECT: { status: 'DONE' },
        SEED_CONTENT: { status: 'RUNNING' },
        PERSIST_TOKEN: { status: 'IDLE' },
        MAP_DOMAIN: { status: 'IDLE' },
        CREATE_WEBHOOK: { status: 'IDLE' },
        OWNER_ELEVATION: { status: 'IDLE' },
      },
    });

    const result = await listTenantsWedgedInProvisioning();

    expect(result).toEqual([]);
  });

  it('excludes a PROVISIONING tenant with no provisioningSteps at all', async () => {
    await insertTestTenant(db, {
      provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
    });

    const result = await listTenantsWedgedInProvisioning();

    expect(result).toEqual([]);
  });

  it.each([
    TENANT_PROVISIONING_STATUS.PENDING,
    TENANT_PROVISIONING_STATUS.READY,
    TENANT_PROVISIONING_STATUS.FAILED,
  ])(
    'excludes a tenant with a FAILED step but overall status %s',
    async (status) => {
      await insertTestTenant(db, {
        provisioningStatus: status,
        provisioningSteps: {
          SANITY_PROJECT: { status: 'FAILED', error: 'boom' },
          SEED_CONTENT: { status: 'IDLE' },
          PERSIST_TOKEN: { status: 'IDLE' },
          MAP_DOMAIN: { status: 'IDLE' },
          CREATE_WEBHOOK: { status: 'IDLE' },
          OWNER_ELEVATION: { status: 'IDLE' },
        },
      });

      const result = await listTenantsWedgedInProvisioning();

      expect(result).toEqual([]);
    },
  );

  it('returns an empty array when no tenants exist', async () => {
    const result = await listTenantsWedgedInProvisioning();

    expect(result).toEqual([]);
  });
});
