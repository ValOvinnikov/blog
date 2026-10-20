import {
  SANITY_PROJECT_DELETE_OUTCOME,
  TENANT_DELETE_SANITY_PROJECT_OUTCOME,
  type TOutcome,
  type TTenantDeleteSanityProjectOutcome,
} from '@blog/config';
import { getDb } from '@blog/db/client';
import { tenants } from '@blog/db/schema/tenants';
import { deleteSanityProject } from '@blog/db/utils/sanity-management-client/sanity-project-lifecycle';
import { toOutcome } from '@blog/utils/to-outcome';
import { eq } from 'drizzle-orm';

export type TDeleteTenantResult =
  | { outcome: 'deleted'; sanityProject: TTenantDeleteSanityProjectOutcome }
  | TOutcome<'not-archived'>
  | TOutcome<'not-found'>;

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
    return toOutcome('not-found');
  }

  if (!existing.deprovisionedAt) {
    return toOutcome('not-archived');
  }

  let sanityProject: TTenantDeleteSanityProjectOutcome =
    TENANT_DELETE_SANITY_PROJECT_OUTCOME.NO_PROJECT;
  if (existing.sanityProjectId) {
    if (sanityManagementToken) {
      const result = await deleteSanityProject({
        token: sanityManagementToken,
        projectId: existing.sanityProjectId,
      });
      sanityProject =
        result.outcome ===
        SANITY_PROJECT_DELETE_OUTCOME.BLOCKED_BY_BILLING_PERMISSION
          ? TENANT_DELETE_SANITY_PROJECT_OUTCOME.LEFT_ARCHIVED
          : result.outcome;
    } else {
      sanityProject = TENANT_DELETE_SANITY_PROJECT_OUTCOME.SKIPPED_NO_TOKEN;
    }
  }

  await db.delete(tenants).where(eq(tenants.id, tenantId));

  return { outcome: 'deleted', sanityProject };
}
