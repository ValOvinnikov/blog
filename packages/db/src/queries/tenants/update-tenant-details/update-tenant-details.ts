import { getDb } from '@blog/db/client';
import {
  MEMBERSHIP_ROLE,
  TENANT_PROVISIONING_STEP,
  TENANT_PROVISIONING_STEP_STATUS,
  type TTenantPlan,
  type TTenantProvisioningStep,
} from '@blog/db/constants';
import { getTenantOwnerEmail } from '@blog/db/queries/memberships';
import { membershipInvites } from '@blog/db/schema/membership-invites';
import { memberships } from '@blog/db/schema/memberships';
import { tenantDomains } from '@blog/db/schema/tenant-domains';
import { tenants, type TTenant } from '@blog/db/schema/tenants';
import { and, eq, isNull, ne } from 'drizzle-orm';

export type TUpdateTenantDetailsInput = {
  name: string;
  slug: string;
  primaryDomain: string;
  plan: TTenantPlan;
  locale: string;
  ownerEmail?: string;
};

export type TUpdateTenantDetailsResult =
  | { outcome: 'updated'; tenant: TTenant }
  | { outcome: 'slug-taken' }
  | { outcome: 'domain-taken' }
  | { outcome: 'slug-locked'; blockingStep: TTenantProvisioningStep }
  | { outcome: 'domain-locked'; blockingStep: TTenantProvisioningStep }
  | { outcome: 'provisioning-started' }
  | { outcome: 'owner-already-joined' }
  | { outcome: 'owner-email-taken' };

// A retry re-runs `run.ts` from `STEPS[0]`, so a stale FAILED entry can
// sit alongside DONE entries for later-indexed steps left over from a prior
// run — this only classifies the tenant as FAILED vs RUNNING/SUCCEEDED;
// which field is actually locked is decided per-step in `lockedFieldOutcome`,
// never by position in the sequence.
type TProvisioningState = 'IDLE' | 'RUNNING' | 'FAILED' | 'SUCCEEDED';

function deriveProvisioningState(
  steps: TTenant['provisioningSteps'],
): TProvisioningState {
  const stepStates = Object.values(steps ?? {});

  if (
    stepStates.length === 0 ||
    stepStates.every(
      (step) => step.status === TENANT_PROVISIONING_STEP_STATUS.IDLE,
    )
  ) {
    return 'IDLE';
  }

  if (
    stepStates.some(
      (step) => step.status === TENANT_PROVISIONING_STEP_STATUS.FAILED,
    )
  ) {
    return 'FAILED';
  }

  if (
    stepStates.every(
      (step) => step.status === TENANT_PROVISIONING_STEP_STATUS.DONE,
    )
  ) {
    return 'SUCCEEDED';
  }

  return 'RUNNING';
}

// Only slug (`DEPLOY_STUDIO`) and primaryDomain (`MAP_DOMAIN`) get baked
// into an external resource by a completed step; name/plan/locale never lock.
function lockedFieldOutcome(
  input: TUpdateTenantDetailsInput,
  existing: TTenant,
):
  | Extract<
      TUpdateTenantDetailsResult,
      { outcome: 'slug-locked' | 'domain-locked' }
    >
  | undefined {
  const steps = existing.provisioningSteps;

  if (
    input.slug !== existing.slug &&
    steps?.[TENANT_PROVISIONING_STEP.DEPLOY_STUDIO]?.status ===
      TENANT_PROVISIONING_STEP_STATUS.DONE
  ) {
    return {
      outcome: 'slug-locked',
      blockingStep: TENANT_PROVISIONING_STEP.DEPLOY_STUDIO,
    };
  }

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

// Pre-checked rather than caught off the `slug_unique`/`tenant_domains.domain`
// unique constraints: a typed outcome the caller can map straight onto a
// field error, instead of an unhandled Postgres throw. First match wins:
// provisioning-started (RUNNING/SUCCEEDED), then slug-locked/domain-locked
// (FAILED, only for a field a completed step already consumed), then
// slug-taken, then domain-taken, then (when `ownerEmail` is supplied)
// owner-already-joined / owner-email-taken.
export async function updateTenantDetails(
  tenantId: string,
  input: TUpdateTenantDetailsInput,
): Promise<TUpdateTenantDetailsResult> {
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

  const provisioningState = deriveProvisioningState(existing.provisioningSteps);

  if (provisioningState === 'RUNNING' || provisioningState === 'SUCCEEDED') {
    return { outcome: 'provisioning-started' };
  }

  if (provisioningState === 'FAILED') {
    const lockedField = lockedFieldOutcome(input, existing);
    if (lockedField) {
      return lockedField;
    }
  }

  const [slugConflict] = await db
    .select({ id: tenants.id })
    .from(tenants)
    .where(and(eq(tenants.slug, input.slug), ne(tenants.id, tenantId)));

  if (slugConflict) {
    return { outcome: 'slug-taken' };
  }

  if (input.primaryDomain !== existing.primaryDomain) {
    const [domainConflict] = await db
      .select({ id: tenantDomains.id })
      .from(tenantDomains)
      .where(eq(tenantDomains.domain, input.primaryDomain));

    if (domainConflict) {
      return { outcome: 'domain-taken' };
    }
  }

  // `ownerEmail` targets the tenant's pending OWNER `membershipInvites` row
  // (see `createTenantDraft`'s `TDraftOwner` union) — not gated by
  // provisioning state, an invited owner can already have signed in and
  // been consumed into a real `memberships` row (see
  // `consumeMembershipInvite`/`getTenantOwnerEmail`). A submitted email that
  // matches the current owner (e.g. an unrelated name/slug edit resubmitting
  // the same value) is a no-op for this concern; only a genuine change is
  // treated as an ownership-transfer attempt and, once a real owner has
  // joined, refused as a distinct outcome instead of silently reassigning it.
  let normalizedOwnerEmail: string | undefined;
  let ownerInviteId: string | undefined;

  if (input.ownerEmail !== undefined) {
    normalizedOwnerEmail = input.ownerEmail.trim().toLowerCase();

    const currentOwnerEmail = await getTenantOwnerEmail(tenantId);
    const ownerEmailChanged =
      currentOwnerEmail?.trim().toLowerCase() !== normalizedOwnerEmail;

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
        return { outcome: 'owner-already-joined' };
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
        return { outcome: 'owner-email-taken' };
      }

      ownerInviteId = pendingInvite.id;
    }
  }

  const [tenant] = await db
    .update(tenants)
    .set({
      name: input.name,
      slug: input.slug,
      primaryDomain: input.primaryDomain,
      plan: input.plan,
      locale: input.locale,
    })
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
      .set({
        name: original.name,
        slug: original.slug,
        primaryDomain: original.primaryDomain,
        plan: original.plan,
        locale: original.locale,
      })
      .where(eq(tenants.id, tenantId));
  }

  // No multi-statement transaction on the runtime `neon-http` driver (see
  // `createTenantDraft`), so each dependent write below is a separate
  // statement with a manual compensating rollback on failure — otherwise a
  // failure partway through could leave `tenants`, `tenant_domains`, and
  // `membership_invites` silently diverged.
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

  if (ownerInviteId) {
    try {
      const [inviteRow] = await db
        .update(membershipInvites)
        .set({ email: normalizedOwnerEmail })
        .where(eq(membershipInvites.id, ownerInviteId))
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
