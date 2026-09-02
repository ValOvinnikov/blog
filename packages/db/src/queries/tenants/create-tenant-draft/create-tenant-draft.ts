import { ERROR_CODE, type TErrorCode } from '@blog/config/constants';
import { getDb, type TDb } from '@blog/db/client';
import {
  MEMBERSHIP_ROLE,
  TENANT_PROVISIONING_STATUS,
  TENANT_PROVISIONING_STEP,
  TENANT_PROVISIONING_STEP_STATUS,
  TENANT_STATUS,
  type TTenantPlan,
  type TTenantProvisioningStep,
} from '@blog/db/constants';
import { membershipInvites } from '@blog/db/schema/membership-invites';
import { memberships } from '@blog/db/schema/memberships';
import { tenantDomains } from '@blog/db/schema/tenant-domains';
import {
  tenants,
  type TProvisioningStepState,
  type TTenant,
  type TTenantProvisioningState,
} from '@blog/db/schema/tenants';
import { isValidDomain } from '@blog/db/utils/is-valid-domain/is-valid-domain';
import { normalizeEmail } from '@blog/db/utils/normalize-email/normalize-email';
import type { TResult } from '@blog/utils';
import { eq } from 'drizzle-orm';

// Either a resolved user (the found-owner path, inserting a real
// `memberships` row) or an email with no resolved user yet (the
// not-found-owner path, inserting a `membershipInvites` row instead —
// consumed into a real membership once that email signs in for the first
// time, see `consumeMembershipInvite`).
export type TDraftOwner =
  { type: 'user'; userId: string } | { type: 'invite'; email: string };

export type TCreateTenantDraftInput = {
  name: string;
  slug: string;
  domain: string;
  locale: string;
  plan: TTenantPlan;
  owner: TDraftOwner;
};

// Every step starts idle — the admin UI's per-step wizard view has
// something to render for all five steps from the moment the tenant row
// exists, before the provisioning workflow has run at all.
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

// Inserts the three rows a brand-new tenant needs before the provisioning
// workflow ever runs: `tenants` itself (status ACTIVE — a draft tenant is a
// real, unsuspended account mid-setup, not a special account state of its
// own; `sanityProjectId`/`sanityDataset` genuinely null until provisioning
// step 1 creates them), its first `tenant_domains` row, and the owner's
// grant — a `memberships` row when `owner` resolved to a real user, or a
// `membershipInvites` row when it didn't (the owner-email-to-user-id lookup
// is a separate concern the caller resolves before calling this; `owner`
// carries whichever outcome that lookup reached). `locale` is likewise an
// explicit required input rather than a hardcoded default: this layer never
// guesses a value the caller hasn't actually supplied.
//
// The initial insert uses the same atomic `onConflictDoNothing()` +
// follow-up read pattern as `createTenant`/`addTenantDomain` — a duplicate
// `slug` is a typed `DB_DUPLICATE_SLUG` outcome rather than a raw Postgres
// constraint error, and (since nothing was written yet) needs no
// compensating cleanup.
//
// Not wrapped in a `db.transaction()` — the runtime `neon-http` driver has
// no multi-statement transaction support (see `unlinkProvider` for the same
// constraint elsewhere in this package). The two dependent inserts run
// after the tenant row exists, in parallel with each other since neither
// depends on the other; if either fails, the tenant row (and any
// partially-succeeded dependent row, via its own `onDelete: 'cascade'` FK)
// is deleted before rethrowing — otherwise a failed call would leave an
// orphaned draft stuck at `provisioningStatus: PENDING` forever, and (since
// `tenants.slug` is unique) permanently block retrying with the same slug.
export async function createTenantDraft(
  input: TCreateTenantDraftInput,
): Promise<TResult<TTenant, TErrorCode>> {
  if (!isValidDomain(input.domain)) {
    return { ok: false, error: ERROR_CODE.DB_INVALID_DOMAIN };
  }

  const db = getDb();

  const [inserted] = await db
    .insert(tenants)
    .values({
      slug: input.slug,
      name: input.name,
      primaryDomain: input.domain,
      locale: input.locale,
      plan: input.plan,
      status: TENANT_STATUS.ACTIVE,
      provisioningStatus: TENANT_PROVISIONING_STATUS.PENDING,
      provisioningSteps: buildIdleProvisioningSteps(),
    })
    .onConflictDoNothing({ target: tenants.slug })
    .returning();

  const tenant = inserted
    ? { ok: true as const, data: inserted }
    : await resolveSlugConflict(db, input.slug);
  if (!tenant.ok) return tenant;

  const ownerInsert =
    input.owner.type === 'user'
      ? db
          .insert(memberships)
          .values({
            tenantId: tenant.data.id,
            userId: input.owner.userId,
            role: MEMBERSHIP_ROLE.OWNER,
          })
          .returning()
      : // A plain insert, not `createMembershipInvite`'s idempotent
        // conflict-handling: `tenant.data.id` is brand new, so the
        // (tenantId, email) unique constraint can't already have a row to
        // collide with.
        db
          .insert(membershipInvites)
          .values({
            tenantId: tenant.data.id,
            email: normalizeEmail(input.owner.email),
            role: MEMBERSHIP_ROLE.OWNER,
          })
          .returning();

  try {
    const [domainRow, ownerRow] = await Promise.all([
      db
        .insert(tenantDomains)
        .values({ tenantId: tenant.data.id, domain: input.domain })
        .returning(),
      ownerInsert,
    ]);

    if (!domainRow[0]) {
      throw new Error(
        `createTenantDraft: tenant_domains insert for tenant "${tenant.data.id}" returned no row.`,
      );
    }

    if (!ownerRow[0]) {
      const table =
        input.owner.type === 'user' ? 'memberships' : 'membership_invites';
      throw new Error(
        `createTenantDraft: ${table} insert for tenant "${tenant.data.id}" returned no row.`,
      );
    }
  } catch (error) {
    await db.delete(tenants).where(eq(tenants.id, tenant.data.id));
    throw error;
  }

  return tenant;
}

// Only reached once the insert itself has no-opped on a `slug` conflict.
async function resolveSlugConflict(
  db: TDb,
  slug: string,
): Promise<TResult<TTenant, TErrorCode>> {
  const [existing] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.slug, slug));

  if (!existing) {
    // A real, if narrow, race: the insert no-ops on a `slug` conflict, but `updateTenantDetails` can rename the slug away before this read.
    return { ok: false, error: ERROR_CODE.DB_NOT_FOUND };
  }

  return { ok: false, error: ERROR_CODE.DB_DUPLICATE_SLUG };
}
