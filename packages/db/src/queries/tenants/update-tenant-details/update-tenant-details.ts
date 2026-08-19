import { getDb } from '@blog/db/client';
import {
  TENANT_PROVISIONING_STEP_STATUS,
  type TTenantPlan,
} from '@blog/db/constants';
import { tenantDomains } from '@blog/db/schema/tenant-domains';
import { tenants, type TTenant } from '@blog/db/schema/tenants';
import { and, eq, ne } from 'drizzle-orm';

export type TUpdateTenantDetailsInput = {
  name: string;
  slug: string;
  primaryDomain: string;
  plan: TTenantPlan;
  locale: string;
};

export type TUpdateTenantDetailsResult =
  | { outcome: 'updated'; tenant: TTenant }
  | { outcome: 'slug-taken' }
  | { outcome: 'provisioning-started' };

// Pre-checked rather than caught off the `slug_unique` constraint: a typed
// `slug-taken` outcome the caller can map straight onto a field error,
// instead of an unhandled Postgres throw.
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

  // Editing slug/primaryDomain after any step has moved past IDLE would
  // desync the row from Vercel/Sanity resources provisioning already created.
  const hasStartedProvisioning = Object.values(
    existing.provisioningSteps ?? {},
  ).some((step) => step.status !== TENANT_PROVISIONING_STEP_STATUS.IDLE);

  if (hasStartedProvisioning) {
    return { outcome: 'provisioning-started' };
  }

  const [slugConflict] = await db
    .select({ id: tenants.id })
    .from(tenants)
    .where(and(eq(tenants.slug, input.slug), ne(tenants.id, tenantId)));

  if (slugConflict) {
    return { outcome: 'slug-taken' };
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

  // No multi-statement transaction on the runtime `neon-http` driver (see
  // `createTenantDraft`), so a changed `primaryDomain` is synced onto
  // `tenant_domains` as a second statement, with a manual compensating
  // rollback of the `tenants` row on failure — otherwise the two tables
  // could silently diverge.
  if (input.primaryDomain !== existing.primaryDomain) {
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
      await db
        .update(tenants)
        .set({
          name: existing.name,
          slug: existing.slug,
          primaryDomain: existing.primaryDomain,
          plan: existing.plan,
          locale: existing.locale,
        })
        .where(eq(tenants.id, tenantId));
      throw error;
    }
  }

  return { outcome: 'updated', tenant };
}
