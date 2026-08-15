import {
  MEMBERSHIP_ROLE,
  TENANT_PROVISIONING_STATUS,
  TENANT_PROVISIONING_STEP,
  TENANT_PROVISIONING_STEP_STATUS,
  TENANT_STATUS,
  type TTenantPlan,
  type TTenantProvisioningStep,
} from '@blog/config/constants';
import { getDb } from '@blog/db/client';
import { memberships } from '@blog/db/schema/memberships';
import { tenantDomains } from '@blog/db/schema/tenant-domains';
import {
  tenants,
  type TProvisioningStepState,
  type TTenant,
  type TTenantProvisioningSteps,
} from '@blog/db/schema/tenants';
import { eq } from 'drizzle-orm';

export type TCreateTenantDraftInput = {
  name: string;
  slug: string;
  domain: string;
  locale: string;
  plan: TTenantPlan;
  ownerUserId: string;
};

// Every step starts idle — the admin UI's per-step wizard view has
// something to render for all five steps from the moment the tenant row
// exists, before the provisioning workflow has run at all.
function buildIdleProvisioningSteps(): TTenantProvisioningSteps {
  const steps = Object.values(
    TENANT_PROVISIONING_STEP,
  ) as TTenantProvisioningStep[];
  const idleState: TProvisioningStepState = {
    status: TENANT_PROVISIONING_STEP_STATUS.IDLE,
  };

  return Object.fromEntries(
    steps.map((step) => [step, idleState]),
  ) as TTenantProvisioningSteps;
}

// Inserts the three rows a brand-new tenant needs before the provisioning
// workflow ever runs: `tenants` itself (status ACTIVE — a draft tenant is a
// real, unsuspended account mid-setup, not a special account state of its
// own; `sanityProjectId`/`sanityDataset` genuinely null until provisioning
// step 1 creates them), its first `tenant_domains` row, and the owner's
// `memberships` row. The owner-email-to-user-id lookup is a separate
// concern the caller resolves before calling this — it takes an
// already-resolved `ownerUserId`. `locale` is likewise an explicit required
// input rather than a hardcoded default: this layer never guesses a value
// the caller hasn't actually supplied.
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
): Promise<TTenant> {
  const db = getDb();

  const [tenant] = await db
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
    .returning();

  if (!tenant) {
    throw new Error(
      `createTenantDraft: insert for slug "${input.slug}" returned no row.`,
    );
  }

  try {
    const [domainRow, membershipRow] = await Promise.all([
      db
        .insert(tenantDomains)
        .values({ tenantId: tenant.id, domain: input.domain })
        .returning(),
      db
        .insert(memberships)
        .values({
          tenantId: tenant.id,
          userId: input.ownerUserId,
          role: MEMBERSHIP_ROLE.OWNER,
        })
        .returning(),
    ]);

    if (!domainRow[0]) {
      throw new Error(
        `createTenantDraft: tenant_domains insert for tenant "${tenant.id}" returned no row.`,
      );
    }

    if (!membershipRow[0]) {
      throw new Error(
        `createTenantDraft: memberships insert for tenant "${tenant.id}" returned no row.`,
      );
    }
  } catch (error) {
    await db.delete(tenants).where(eq(tenants.id, tenant.id));
    throw error;
  }

  return tenant;
}
