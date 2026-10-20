import {
  SANITY_PROJECT_DELETE_OUTCOME,
  TENANT_DELETE_OUTCOME,
  TENANT_DELETE_SANITY_PROJECT_OUTCOME,
  type TOutcome,
  type TTenantDeleteOutcome,
  type TTenantDeleteSanityProjectOutcome,
} from '@blog/config';
import { getDb } from '@blog/db/client';
import { tenants } from '@blog/db/schema/tenants';
import { deleteSanityProject } from '@blog/db/utils/sanity-management-client/sanity-project-lifecycle';
import { toOutcome } from '@blog/utils/to-outcome';
import { eq } from 'drizzle-orm';

type TDeleted = typeof TENANT_DELETE_OUTCOME.DELETED;

export type TDeleteTenantResult =
  | (TOutcome<TDeleted> & { sanityProject: TTenantDeleteSanityProjectOutcome })
  | TOutcome<Exclude<TTenantDeleteOutcome, TDeleted>>;

// Relies on cascading FKs: a new tenant-scoped table needs its own cascade to stay swept.
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
    return toOutcome(TENANT_DELETE_OUTCOME.NOT_FOUND);
  }

  if (!existing.deprovisionedAt) {
    return toOutcome(TENANT_DELETE_OUTCOME.NOT_ARCHIVED);
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

  return { ...toOutcome(TENANT_DELETE_OUTCOME.DELETED), sanityProject };
}
