import { getDb } from '@blog/db/client';
import {
  TENANT_PROVISIONING_STATUS,
  TENANT_PROVISIONING_STEP,
  TENANT_PROVISIONING_STEP_STATUS,
  TENANT_STATUS,
  type TTenantProvisioningStep,
} from '@blog/db/constants';
import {
  tenants,
  type TProvisioningStepState,
  type TTenant,
  type TTenantProvisioningState,
} from '@blog/db/schema/tenants';
import { eq } from 'drizzle-orm';

type TTenantDraftValues = Omit<
  typeof tenants.$inferInsert,
  'status' | 'provisioningStatus' | 'provisioningSteps'
>;

function buildIdleProvisioningSteps(): TTenantProvisioningState {
  const steps = Object.values(
    TENANT_PROVISIONING_STEP,
  ) as TTenantProvisioningStep[];
  const idleState: TProvisioningStepState = {
    status: TENANT_PROVISIONING_STEP_STATUS.IDLE,
  };

  return Object.fromEntries(steps.map((step) => [step, idleState])) as Record<
    TTenantProvisioningStep,
    TProvisioningStepState
  >;
}

// `neon-http` has no multi-statement transactions, so a failed dependent insert deletes the tenant row by hand; its FK cascades sweep the rest.
export async function insertTenantWithDependents(
  values: TTenantDraftValues,
  insertDependents: (tenant: TTenant) => Promise<unknown>,
): Promise<TTenant> {
  const db = getDb();

  const [tenant] = await db
    .insert(tenants)
    .values({
      ...values,
      status: TENANT_STATUS.ACTIVE,
      provisioningStatus: TENANT_PROVISIONING_STATUS.PENDING,
      provisioningSteps: buildIdleProvisioningSteps(),
    })
    .returning();

  if (!tenant) {
    throw new Error(
      'insertTenantWithDependents: tenant insert returned no row.',
    );
  }

  try {
    await insertDependents(tenant);
  } catch (error) {
    await db.delete(tenants).where(eq(tenants.id, tenant.id));
    throw error;
  }

  return tenant;
}
