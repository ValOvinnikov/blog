import { getDb } from '@blog/db/client';
import { TENANT_STATUS } from '@blog/db/constants';
import { tenants, type TTenant } from '@blog/db/schema/tenants';
import { and, eq, isNull } from 'drizzle-orm';

/**
 * Scope predicate for the document-validation sweep: `status` ACTIVE and
 * never deprovisioned — kept identical to the tenant content-migration
 * fan-out's own predicate.
 */
export async function listTenantsForDocumentValidation(): Promise<TTenant[]> {
  const db = getDb();

  return db
    .select()
    .from(tenants)
    .where(
      and(
        eq(tenants.status, TENANT_STATUS.ACTIVE),
        isNull(tenants.deprovisionedAt),
      ),
    );
}
