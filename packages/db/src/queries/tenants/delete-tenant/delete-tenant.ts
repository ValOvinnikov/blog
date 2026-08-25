import { getDb } from '@blog/db/client';
import { tenants } from '@blog/db/schema/tenants';
import { deleteSanityProject } from '@blog/db/utils/sanity-management-client/sanity-management-client';
import { eq } from 'drizzle-orm';

// What happened to the tenant's still-existing (archived by deprovisioning)
// Sanity project during a permanent delete. `deleted` and `already-gone`
// (a 404 — nothing left to delete) are kept distinct rather than folded
// together, same as `left-archived` is kept distinct from both — none of
// the three is "as good as deleted" from a caller's point of view.
// `no-project` covers a tenant that never had one. `skipped-no-token` is
// what happens on every call today: no caller currently supplies
// `sanityManagementToken`, so the archived project is left exactly as
// deprovisioning left it.
export type TDeleteTenantSanityProjectOutcome =
  | 'deleted'
  | 'already-gone'
  | 'left-archived'
  | 'no-project'
  | 'skipped-no-token';

export type TDeleteTenantResult =
  | { outcome: 'deleted'; sanityProject: TDeleteTenantSanityProjectOutcome }
  | { outcome: 'not-archived' }
  | { outcome: 'not-found' };

/**
 * Hard-deletes a tenant row — unlike `archiveTenant`, this is irreversible
 * and relies on cascading FKs on every tenant-scoped table to sweep
 * dependent rows, so a new tenant-scoped table needs its own cascade to
 * stay swept. Refusal and not-found are typed outcomes rather than throws,
 * since a stale id or an unarchived tenant are reachable, non-exceptional
 * callers.
 *
 * `sanityManagementToken` is optional: passing it also attempts to delete
 * the tenant's Sanity project (archived, not removed, by deprovisioning),
 * tolerating the same org-billing-permission 401 project cancellation has
 * always hit — the row is still hard-deleted when that happens, and
 * `sanityProject` on the result says plainly what became of the project
 * rather than assuming success. Any other Sanity failure still throws,
 * before the row is touched, same as `deleteSanityProject` itself.
 */
export async function deleteTenant(
  tenantId: string,
  sanityManagementToken?: string,
): Promise<TDeleteTenantResult> {
  const db = getDb();

  const [existing] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.id, tenantId));

  if (!existing) {
    return { outcome: 'not-found' };
  }

  if (!existing.deprovisionedAt) {
    return { outcome: 'not-archived' };
  }

  let sanityProject: TDeleteTenantSanityProjectOutcome = 'no-project';
  if (existing.sanityProjectId) {
    if (sanityManagementToken) {
      const result = await deleteSanityProject({
        token: sanityManagementToken,
        projectId: existing.sanityProjectId,
      });
      sanityProject =
        result.outcome === 'blocked-by-billing-permission'
          ? 'left-archived'
          : result.outcome;
    } else {
      sanityProject = 'skipped-no-token';
    }
  }

  await db.delete(tenants).where(eq(tenants.id, tenantId));

  return { outcome: 'deleted', sanityProject };
}
