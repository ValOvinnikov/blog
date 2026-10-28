import type { TMaybeUndefined, TOutcome } from '@blog/config';
import { getDb } from '@blog/db/client';
import {
  PROVISIONING_STATE,
  TENANT_DETAILS_UPDATE_OUTCOME,
  TENANT_PROVISIONING_STEP,
  TENANT_PROVISIONING_STEP_STATUS,
  type TTenantPlan,
  type TTenantProvisioningStep,
} from '@blog/db/constants';
import { isFreeOwnerViolation } from '@blog/db/queries/tenants/is-free-owner-violation';
import { tenantDomains } from '@blog/db/schema/tenant-domains';
import { tenants, type TTenant } from '@blog/db/schema/tenants';
import { deriveProvisioningState } from '@blog/db/utils/derive-provisioning-state/derive-provisioning-state';
import { isValidDomain } from '@blog/db/utils/is-valid-domain/is-valid-domain';
import { normalizeLocaleCode } from '@blog/db/utils/normalize-locale-code/normalize-locale-code';
import { isUndefined } from '@blog/utils/primitives';
import { toOutcome } from '@blog/utils/to-outcome';
import { and, eq } from 'drizzle-orm';

import {
  applyOwnerEmailChange,
  findOwnerEmailChange,
  type TOwnerEmailChange,
  type TOwnerEmailRefusal,
} from './owner-email-change';
import {
  changesTenantDetails,
  restorableTenantFields,
  tenantDetailsFields,
} from './tenant-details-fields';

export type TUpdateTenantDetailsInput = {
  name: string;
  primaryDomain: string;
  plan: TTenantPlan;
  locale: string;
  ownerEmail?: string;
};

const OUTCOME = TENANT_DETAILS_UPDATE_OUTCOME;

export type TUpdateTenantDetailsResult =
  | {
      outcome: typeof OUTCOME.UPDATED;
      tenant: TTenant;
      previousOwnerEmail: TMaybeUndefined<string>;
    }
  | TOutcome<typeof OUTCOME.DOMAIN_TAKEN>
  | {
      outcome: typeof OUTCOME.DOMAIN_LOCKED;
      blockingStep: TTenantProvisioningStep;
    }
  | TOutcome<typeof OUTCOME.DOMAIN_INVALID>
  | TOutcome<typeof OUTCOME.PROVISIONING_STARTED>
  | TOwnerEmailRefusal
  | TOutcome<typeof OUTCOME.OWNS_FREE_TENANT>;

// Only primaryDomain (`MAP_DOMAIN`) gets baked into an external resource by
// a completed step; name/plan/locale never lock.
function lockedFieldOutcome(
  input: TUpdateTenantDetailsInput,
  existing: TTenant,
): TMaybeUndefined<
  Extract<TUpdateTenantDetailsResult, TOutcome<typeof OUTCOME.DOMAIN_LOCKED>>
> {
  const steps = existing.provisioningSteps;

  if (
    input.primaryDomain !== existing.primaryDomain &&
    steps?.[TENANT_PROVISIONING_STEP.MAP_DOMAIN]?.status ===
      TENANT_PROVISIONING_STEP_STATUS.DONE
  ) {
    return {
      outcome: OUTCOME.DOMAIN_LOCKED,
      blockingStep: TENANT_PROVISIONING_STEP.MAP_DOMAIN,
    };
  }

  return undefined;
}

// Domain conflicts are pre-checked rather than caught off the
// `tenant_domains.domain` unique constraint, so the caller gets a typed
// outcome instead of a Postgres throw.
export async function updateTenantDetails(
  tenantId: string,
  input: TUpdateTenantDetailsInput,
): Promise<TUpdateTenantDetailsResult> {
  if (!isValidDomain(input.primaryDomain)) {
    return toOutcome(OUTCOME.DOMAIN_INVALID);
  }

  const db = getDb();

  const [existing] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.id, tenantId));

  if (!existing) {
    throw new Error(
      `updateTenantDetails: no tenant found for id "${tenantId}".`,
    );
  }

  const provisioningState = deriveProvisioningState(
    existing.provisioningStatus,
    existing.provisioningSteps,
  );

  const details = tenantDetailsFields({
    ...input,
    locale: normalizeLocaleCode(input.locale),
  });

  if (
    provisioningState === PROVISIONING_STATE.RUNNING ||
    (provisioningState === PROVISIONING_STATE.SUCCEEDED &&
      changesTenantDetails(details, existing))
  ) {
    return toOutcome(OUTCOME.PROVISIONING_STARTED);
  }

  if (provisioningState === PROVISIONING_STATE.FAILED) {
    const lockedField = lockedFieldOutcome(input, existing);
    if (lockedField) {
      return lockedField;
    }
  }

  if (input.primaryDomain !== existing.primaryDomain) {
    const [domainConflict] = await db
      .select({ id: tenantDomains.id })
      .from(tenantDomains)
      .where(eq(tenantDomains.domain, input.primaryDomain));

    if (domainConflict) {
      return toOutcome(OUTCOME.DOMAIN_TAKEN);
    }
  }

  let ownerEmailChange: TMaybeUndefined<TOwnerEmailChange>;

  if (!isUndefined(input.ownerEmail)) {
    const found = await findOwnerEmailChange(tenantId, input.ownerEmail);
    if (found && 'outcome' in found) return found;
    ownerEmailChange = found;
  }

  let tenant: TMaybeUndefined<TTenant>;
  try {
    [tenant] = await db
      .update(tenants)
      .set(
        ownerEmailChange
          ? { ...details, unsentReinviteFormerOwnerEmailEncrypted: null }
          : details,
      )
      .where(eq(tenants.id, tenantId))
      .returning();
  } catch (error) {
    if (isFreeOwnerViolation(error)) return toOutcome(OUTCOME.OWNS_FREE_TENANT);
    throw error;
  }

  if (!tenant) {
    throw new Error(
      `updateTenantDetails: update for tenant "${tenantId}" returned no row.`,
    );
  }

  async function restoreTenantRow(original: TTenant): Promise<void> {
    await db
      .update(tenants)
      .set(restorableTenantFields(original))
      .where(eq(tenants.id, tenantId));
  }

  const domainChanged = input.primaryDomain !== existing.primaryDomain;

  if (domainChanged) {
    try {
      const domainRows = await db
        .update(tenantDomains)
        .set({ domain: input.primaryDomain })
        .where(
          and(
            eq(tenantDomains.tenantId, tenantId),
            eq(tenantDomains.domain, existing.primaryDomain),
          ),
        )
        .returning();

      if (!domainRows[0]) {
        throw new Error(
          `updateTenantDetails: no tenant_domains row matched tenant "${tenantId}"'s previous primary domain "${existing.primaryDomain}".`,
        );
      }
    } catch (error) {
      await restoreTenantRow(existing);
      throw error;
    }
  }

  if (ownerEmailChange) {
    try {
      await applyOwnerEmailChange(ownerEmailChange);
    } catch (error) {
      if (domainChanged) {
        await db
          .update(tenantDomains)
          .set({ domain: existing.primaryDomain })
          .where(
            and(
              eq(tenantDomains.tenantId, tenantId),
              eq(tenantDomains.domain, input.primaryDomain),
            ),
          );
      }
      await restoreTenantRow(existing);
      throw error;
    }
  }

  return {
    outcome: OUTCOME.UPDATED,
    tenant,
    previousOwnerEmail: ownerEmailChange?.previousEmail,
  };
}
