import { getDb } from '@blog/db/client';
import { tenants, type TTenant } from '@blog/db/schema/tenants';
import { inArray } from 'drizzle-orm';

/**
 * Resolves tenant ids to tenants in a single batch query. Ids with no
 * matching row are silently omitted. Result order is database order, not
 * input order — callers that need input order must re-sort themselves.
 */
export async function listTenantsByIds(ids: string[]): Promise<TTenant[]> {
  if (ids.length === 0) {
    return [];
  }

  const db = getDb();

  return db.select().from(tenants).where(inArray(tenants.id, ids));
}
