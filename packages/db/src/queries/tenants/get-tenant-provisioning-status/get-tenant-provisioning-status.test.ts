import { LOCALE_ISO_CODES } from '@blog/config/constants';
import {
  TENANT_PLAN,
  TENANT_PROVISIONING_STATUS,
  TENANT_PROVISIONING_STEP_STATUS,
  TENANT_STATUS,
} from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import type { TTenantProvisioningState } from '@blog/db/schema/tenants';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';

import { getTenantProvisioningStatus } from './get-tenant-provisioning-status';

vi.mock('@blog/db/client');

const NO_TENANT_ROW = 'setup: tenant insert returned no row.';

const db = useQueryTestDb();

afterEach(async () => {
  await db().delete(schema.tenants);
});

describe(getTenantProvisioningStatus, () => {
  it('returns the overall status and per-step map for an existing tenant', async () => {
    const provisioningSteps: TTenantProvisioningState = {
      SANITY_PROJECT: { status: TENANT_PROVISIONING_STEP_STATUS.DONE },
      SEED_CONTENT: { status: TENANT_PROVISIONING_STEP_STATUS.RUNNING },
      PERSIST_TOKEN: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
      MAP_DOMAIN: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
      CREATE_WEBHOOK: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
      VERIFY_CONTENT: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
      OWNER_ELEVATION: { status: TENANT_PROVISIONING_STEP_STATUS.IDLE },
    };
    const [tenant] = await db()
      .insert(schema.tenants)
      .values({
        name: 'Acme',
        primaryDomain: 'acme.example.com',
        locale: LOCALE_ISO_CODES.EN,
        plan: TENANT_PLAN.FREE,
        status: TENANT_STATUS.ACTIVE,
        provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
        provisioningSteps,
      })
      .returning();

    if (!tenant) throw new Error(NO_TENANT_ROW);

    const result = await getTenantProvisioningStatus(tenant.id);

    expect(result).toEqual({
      provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
      provisioningSteps,
    });
  });

  it('returns undefined for a tenant id that does not exist', async () => {
    const result = await getTenantProvisioningStatus(
      '00000000-0000-0000-0000-000000000000',
    );

    expect(result).toBeUndefined();
  });

  it('returns null fields for a tenant that predates provisioning tracking', async () => {
    const [tenant] = await db()
      .insert(schema.tenants)
      .values({
        name: 'Legacy',
        primaryDomain: 'legacy.example.com',
        locale: LOCALE_ISO_CODES.EN,
        plan: TENANT_PLAN.FREE,
        status: TENANT_STATUS.ACTIVE,
      })
      .returning();

    if (!tenant) throw new Error(NO_TENANT_ROW);

    const result = await getTenantProvisioningStatus(tenant.id);

    expect(result).toEqual({
      provisioningStatus: null,
      provisioningSteps: null,
    });
  });
});
