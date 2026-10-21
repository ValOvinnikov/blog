import { ERROR_CODE, type TErrorCode } from '@blog/config/constants';
import { getDb } from '@blog/db/client';
import {
  TENANT_PROVISIONING_STATUS,
  TENANT_PROVISIONING_STEP,
  TENANT_PROVISIONING_STEP_STATUS,
  TENANT_STATUS,
  type TTenantPlan,
  type TTenantProvisioningStep,
} from '@blog/db/constants';
import { tenantDomains } from '@blog/db/schema/tenant-domains';
import {
  tenants,
  type TProvisioningStepState,
  type TTenant,
  type TTenantProvisioningState,
} from '@blog/db/schema/tenants';
import { isValidDomain } from '@blog/db/utils/is-valid-domain/is-valid-domain';
import { normalizeLocaleCode } from '@blog/db/utils/normalize-locale-code/normalize-locale-code';
import type { TResult } from '@blog/utils';
import { eq } from 'drizzle-orm';

import { insertDraftOwner, type TDraftOwner } from './insert-draft-owner';

export type TCreateTenantDraftInput = {
  name: string;
  domain: string;
  locale: string;
  plan: TTenantPlan;
  owner: TDraftOwner;
};

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

// `neon-http` has no multi-statement transactions, so a failed dependent insert deletes the tenant row by hand.
export async function createTenantDraft(
  input: TCreateTenantDraftInput,
): Promise<TResult<TTenant, TErrorCode>> {
  if (!isValidDomain(input.domain)) {
    return { ok: false, error: ERROR_CODE.DB_INVALID_DOMAIN };
  }

  const db = getDb();

  const [tenant] = await db
    .insert(tenants)
    .values({
      name: input.name,
      primaryDomain: input.domain,
      locale: normalizeLocaleCode(input.locale),
      plan: input.plan,
      status: TENANT_STATUS.ACTIVE,
      provisioningStatus: TENANT_PROVISIONING_STATUS.PENDING,
      provisioningSteps: buildIdleProvisioningSteps(),
    })
    .returning();

  if (!tenant) {
    throw new Error('createTenantDraft: tenant insert returned no row.');
  }

  try {
    const [domainRow, ownerRow] = await Promise.all([
      db
        .insert(tenantDomains)
        .values({ tenantId: tenant.id, domain: input.domain })
        .returning(),
      insertDraftOwner(tenant.id, input.owner),
    ]);

    if (!domainRow[0]) {
      throw new Error(
        `createTenantDraft: tenant_domains insert for tenant "${tenant.id}" returned no row.`,
      );
    }

    if (!ownerRow[0]) {
      const table =
        input.owner.type === 'user' ? 'memberships' : 'membership_invites';
      throw new Error(
        `createTenantDraft: ${table} insert for tenant "${tenant.id}" returned no row.`,
      );
    }
  } catch (error) {
    await db.delete(tenants).where(eq(tenants.id, tenant.id));
    throw error;
  }

  return { ok: true, data: tenant };
}
