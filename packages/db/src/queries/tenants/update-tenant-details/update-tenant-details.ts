import type { TMaybeUndefined, TOutcome } from '@blog/config';
import type { TLocaleIsoCode } from '@blog/config/constants';
import { getDb } from '@blog/db/client';
import {
  MEMBERSHIP_ROLE,
  PROVISIONING_STATE,
  TENANT_PROVISIONING_STEP,
  TENANT_PROVISIONING_STEP_STATUS,
  type TTenantPlan,
  type TTenantProvisioningStep,
} from '@blog/db/constants';
import { inviteEmailColumns } from '@blog/db/queries/membership-invites/invite-email-columns';
import { getTenantOwnerEmail } from '@blog/db/queries/memberships';
import { membershipInvites } from '@blog/db/schema/membership-invites';
import { memberships } from '@blog/db/schema/memberships';
import { tenantDomains } from '@blog/db/schema/tenant-domains';
import { tenants, type TTenant } from '@blog/db/schema/tenants';
import { deriveProvisioningState } from '@blog/db/utils/derive-provisioning-state/derive-provisioning-state';
import { isValidDomain } from '@blog/db/utils/is-valid-domain/is-valid-domain';
import { normalizeLocaleCode } from '@blog/db/utils/normalize-locale-code/normalize-locale-code';
import { normalizeEmail } from '@blog/utils/normalize-email-identity';
import { isUndefined } from '@blog/utils/primitives';
import { toOutcome } from '@blog/utils/to-outcome';
import { and, eq, isNull, ne } from 'drizzle-orm';

export type TUpdateTenantDetailsInput = {
  name: string;
  primaryDomain: string;
  plan: TTenantPlan;
  locale: string;
  ownerEmail?: string;
};

type TTenantDetailsFields = {
  name: string;
  primaryDomain: string;
  plan: TTenantPlan;
  locale: TLocaleIsoCode;
};

function tenantDetailsFields(
  source: TTenantDetailsFields,
): TTenantDetailsFields {
  return {
    name: source.name,
    primaryDomain: source.primaryDomain,
    plan: source.plan,
    locale: source.locale,
  };
}

export type TUpdateTenantDetailsResult =
  | { outcome: 'updated'; tenant: TTenant }
  | TOutcome<'domain-taken'>
  | { outcome: 'domain-locked'; blockingStep: TTenantProvisioningStep }
  | TOutcome<'domain-invalid'>
  | TOutcome<'provisioning-started'>
  | TOutcome<'owner-already-joined'>
  | TOutcome<'owner-email-taken'>;

// Only primaryDomain (`MAP_DOMAIN`) gets baked into an external resource by
// a completed step; name/plan/locale never lock.
function lockedFieldOutcome(
  input: TUpdateTenantDetailsInput,
  existing: TTenant,
): TMaybeUndefined<
  Extract<TUpdateTenantDetailsResult, TOutcome<'domain-locked'>>
> {
  const steps = existing.provisioningSteps;

  if (
    input.primaryDomain !== existing.primaryDomain &&
    steps?.[TENANT_PROVISIONING_STEP.MAP_DOMAIN]?.status ===
      TENANT_PROVISIONING_STEP_STATUS.DONE
  ) {
    return {
      outcome: 'domain-locked',
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
    return toOutcome('domain-invalid');
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

  if (
    provisioningState === PROVISIONING_STATE.RUNNING ||
    provisioningState === PROVISIONING_STATE.SUCCEEDED
  ) {
    return toOutcome('provisioning-started');
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
      return toOutcome('domain-taken');
    }
  }

  let ownerInviteUpdate: TMaybeUndefined<{ id: string; email: string }>;

  if (!isUndefined(input.ownerEmail)) {
    const normalizedOwnerEmail = normalizeEmail(input.ownerEmail);

    const currentOwnerEmail = await getTenantOwnerEmail(tenantId);
    const normalizedCurrentOwnerEmail = isUndefined(currentOwnerEmail)
      ? undefined
      : normalizeEmail(currentOwnerEmail);
    const ownerEmailChanged =
      normalizedCurrentOwnerEmail !== normalizedOwnerEmail;

    if (ownerEmailChanged) {
      const [joinedOwner] = await db
        .select({ id: memberships.id })
        .from(memberships)
        .where(
          and(
            eq(memberships.tenantId, tenantId),
            eq(memberships.role, MEMBERSHIP_ROLE.OWNER),
          ),
        );

      if (joinedOwner) {
        return toOutcome('owner-already-joined');
      }

      const [pendingInvite] = await db
        .select({ id: membershipInvites.id })
        .from(membershipInvites)
        .where(
          and(
            eq(membershipInvites.tenantId, tenantId),
            eq(membershipInvites.role, MEMBERSHIP_ROLE.OWNER),
            isNull(membershipInvites.consumedAt),
          ),
        );

      if (!pendingInvite) {
        throw new Error(
          `updateTenantDetails: no pending owner invite found for tenant "${tenantId}".`,
        );
      }

      const [emailConflict] = await db
        .select({ id: membershipInvites.id })
        .from(membershipInvites)
        .where(
          and(
            eq(membershipInvites.tenantId, tenantId),
            eq(membershipInvites.email, normalizedOwnerEmail),
            ne(membershipInvites.id, pendingInvite.id),
          ),
        );

      if (emailConflict) {
        return toOutcome('owner-email-taken');
      }

      ownerInviteUpdate = { id: pendingInvite.id, email: normalizedOwnerEmail };
    }
  }

  const [tenant] = await db
    .update(tenants)
    .set(
      tenantDetailsFields({
        ...input,
        locale: normalizeLocaleCode(input.locale),
      }),
    )
    .where(eq(tenants.id, tenantId))
    .returning();

  if (!tenant) {
    throw new Error(
      `updateTenantDetails: update for tenant "${tenantId}" returned no row.`,
    );
  }

  async function restoreTenantRow(original: TTenant): Promise<void> {
    await db
      .update(tenants)
      .set(tenantDetailsFields(original))
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

  if (ownerInviteUpdate) {
    try {
      const [inviteRow] = await db
        .update(membershipInvites)
        .set(inviteEmailColumns(ownerInviteUpdate.email))
        .where(eq(membershipInvites.id, ownerInviteUpdate.id))
        .returning();

      if (!inviteRow) {
        throw new Error(
          `updateTenantDetails: owner invite update for tenant "${tenantId}" returned no row.`,
        );
      }
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

  return { outcome: 'updated', tenant };
}
