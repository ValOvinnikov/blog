import { LOCALE_ISO_CODES } from '@blog/config/constants';
import {
  TENANT_PLAN,
  TENANT_PROVISIONING_STEP_STATUS,
  TENANT_STATUS,
} from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import type { TTenantDeprovisioningState } from '@blog/db/schema/tenants';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';

import { getTenantDeprovisioningStatus } from './get-tenant-deprovisioning-status';

vi.mock('@blog/db/client');

const NO_TENANT_ROW = 'setup: tenant insert returned no row.';

const db = useQueryTestDb();

afterEach(async () => {
  await db().delete(schema.tenants);
});

describe(getTenantDeprovisioningStatus, () => {
  it('returns the per-step map and deprovisionedAt for an existing tenant', async () => {
    const deprovisioningSteps: TTenantDeprovisioningState = {
      REMOVE_DOMAIN: { status: TENANT_PROVISIONING_STEP_STATUS.DONE },
      ARCHIVE_SANITY_PROJECT: {
        status: TENANT_PROVISIONING_STEP_STATUS.RUNNING,
      },
      REVOKE_SANITY_TOKENS: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
      CLEAR_ARTIFACTS: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
      ARCHIVE_TENANT: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
      PURGE_READER_DATA: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
      INVALIDATE_TENANT_CACHE: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
    };
    const [tenant] = await db()
      .insert(schema.tenants)
      .values({
        name: 'Acme',
        primaryDomain: 'acme.example.com',
        locale: LOCALE_ISO_CODES.EN,
        plan: TENANT_PLAN.FREE,
        status: TENANT_STATUS.ACTIVE,
        deprovisioningSteps,
      })
      .returning();

    if (!tenant) throw new Error(NO_TENANT_ROW);

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
    const [tenant] = await db()
      .insert(schema.tenants)
      .values({
        name: 'Never Deprovisioned',
        primaryDomain: 'never.example.com',
        locale: LOCALE_ISO_CODES.EN,
        plan: TENANT_PLAN.FREE,
        status: TENANT_STATUS.ACTIVE,
      })
      .returning();

    if (!tenant) throw new Error(NO_TENANT_ROW);

    const result = await getTenantDeprovisioningStatus(tenant.id);

    expect(result).toEqual({
      deprovisioningSteps: null,
      deprovisionedAt: null,
    });
  });

  it('reports a finished teardown via deprovisionedAt', async () => {
    const deprovisionedAt = new Date('2026-09-02T12:00:00.000Z');
    const [tenant] = await db()
      .insert(schema.tenants)
      .values({
        name: 'Deprovisioned',
        primaryDomain: 'gone.example.com',
        locale: LOCALE_ISO_CODES.EN,
        plan: TENANT_PLAN.FREE,
        status: TENANT_STATUS.ARCHIVED,
        deprovisionedAt,
      })
      .returning();

    if (!tenant) throw new Error(NO_TENANT_ROW);

    const result = await getTenantDeprovisioningStatus(tenant.id);

    expect(result?.deprovisionedAt).toEqual(deprovisionedAt);
  });
});
