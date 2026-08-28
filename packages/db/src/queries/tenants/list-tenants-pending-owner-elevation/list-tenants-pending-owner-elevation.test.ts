import {
  TENANT_PLAN,
  TENANT_PROVISIONING_STATUS,
  TENANT_STATUS,
} from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { createTestDb } from '@blog/db/testing/create-test-db';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

import { listTenantsPendingOwnerElevation } from './list-tenants-pending-owner-elevation';

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

const baseTenant = {
  name: 'Acme',
  primaryDomain: 'acme.example.com',
  sanityProjectId: 'p1',
  sanityDataset: 'production',
  locale: 'en',
  plan: TENANT_PLAN.FREE,
};

describe(listTenantsPendingOwnerElevation, () => {
  it('includes an ACTIVE, READY tenant', async () => {
    await db.insert(schema.tenants).values({
      ...baseTenant,
      slug: 'acme',
      status: TENANT_STATUS.ACTIVE,
      provisioningStatus: TENANT_PROVISIONING_STATUS.READY,
    });

    const result = await listTenantsPendingOwnerElevation();

    expect(result.map((tenant) => tenant.slug)).toEqual(['acme']);
  });

  it.each([
    TENANT_PROVISIONING_STATUS.PENDING,
    TENANT_PROVISIONING_STATUS.PROVISIONING,
    TENANT_PROVISIONING_STATUS.FAILED,
  ])('excludes a tenant with provisioningStatus %s', async (status) => {
    await db.insert(schema.tenants).values({
      ...baseTenant,
      slug: 'acme',
      status: TENANT_STATUS.ACTIVE,
      provisioningStatus: status,
    });

    const result = await listTenantsPendingOwnerElevation();

    expect(result).toEqual([]);
  });

  it.each([TENANT_STATUS.SUSPENDED, TENANT_STATUS.ARCHIVED])(
    'excludes a tenant with status %s',
    async (status) => {
      await db.insert(schema.tenants).values({
        ...baseTenant,
        slug: 'acme',
        status,
        provisioningStatus: TENANT_PROVISIONING_STATUS.READY,
        ...(status === TENANT_STATUS.ARCHIVED
          ? { deprovisionedAt: new Date() }
          : {}),
      });

      const result = await listTenantsPendingOwnerElevation();

      expect(result).toEqual([]);
    },
  );

  it('excludes a deprovisioned tenant', async () => {
    await db.insert(schema.tenants).values({
      ...baseTenant,
      slug: 'acme',
      status: TENANT_STATUS.ARCHIVED,
      provisioningStatus: TENANT_PROVISIONING_STATUS.READY,
      deprovisionedAt: new Date(),
    });

    const result = await listTenantsPendingOwnerElevation();

    expect(result).toEqual([]);
  });

  it('returns an empty array when no tenants exist', async () => {
    const result = await listTenantsPendingOwnerElevation();

    expect(result).toEqual([]);
  });
});
