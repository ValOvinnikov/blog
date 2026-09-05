import { TENANT_PLAN, TENANT_STATUS } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import type { TTenantDeprovisioningState } from '@blog/db/schema/tenants';
import { createTestDb } from '@blog/db/testing/create-test-db';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

import { getTenantDeprovisioningStatus } from './get-tenant-deprovisioning-status';

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

describe(getTenantDeprovisioningStatus, () => {
  it('returns the per-step map and deprovisionedAt for an existing tenant', async () => {
    const deprovisioningSteps: TTenantDeprovisioningState = {
      REMOVE_DOMAIN: { status: 'DONE' },
      ARCHIVE_SANITY_PROJECT: { status: 'RUNNING' },
      REVOKE_SANITY_TOKENS: { status: 'IDLE' },
      CLEAR_ARTIFACTS: { status: 'IDLE' },
      ARCHIVE_TENANT: { status: 'IDLE' },
      INVALIDATE_TENANT_CACHE: { status: 'IDLE' },
    };
    const [tenant] = await db
      .insert(schema.tenants)
      .values({
        name: 'Acme',
        primaryDomain: 'acme.example.com',
        locale: 'en',
        plan: TENANT_PLAN.FREE,
        status: TENANT_STATUS.ACTIVE,
        deprovisioningSteps,
      })
      .returning();

    if (!tenant) throw new Error('setup: tenant insert returned no row.');

    const result = await getTenantDeprovisioningStatus(tenant.id);

    expect(result).toEqual({
      deprovisioningSteps,
      deprovisionedAt: null,
    });
  });

  it('returns undefined for a tenant id that does not exist', async () => {
    const result = await getTenantDeprovisioningStatus(
      '00000000-0000-0000-0000-000000000000',
    );

    expect(result).toBeUndefined();
  });

  it('returns null fields for a tenant never deprovisioned', async () => {
    const [tenant] = await db
      .insert(schema.tenants)
      .values({
        name: 'Never Deprovisioned',
        primaryDomain: 'never.example.com',
        locale: 'en',
        plan: TENANT_PLAN.FREE,
        status: TENANT_STATUS.ACTIVE,
      })
      .returning();

    if (!tenant) throw new Error('setup: tenant insert returned no row.');

    const result = await getTenantDeprovisioningStatus(tenant.id);

    expect(result).toEqual({
      deprovisioningSteps: null,
      deprovisionedAt: null,
    });
  });

  it('reports a finished teardown via deprovisionedAt', async () => {
    const deprovisionedAt = new Date('2026-09-02T12:00:00.000Z');
    const [tenant] = await db
      .insert(schema.tenants)
      .values({
        name: 'Deprovisioned',
        primaryDomain: 'gone.example.com',
        locale: 'en',
        plan: TENANT_PLAN.FREE,
        status: TENANT_STATUS.ARCHIVED,
        deprovisionedAt,
      })
      .returning();

    if (!tenant) throw new Error('setup: tenant insert returned no row.');

    const result = await getTenantDeprovisioningStatus(tenant.id);

    expect(result?.deprovisionedAt).toEqual(deprovisionedAt);
  });
});
