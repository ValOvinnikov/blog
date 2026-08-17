import { getDb } from '@blog/db/client';
import { tenants, type TTenant } from '@blog/db/schema/tenants';
import { eq } from 'drizzle-orm';

export async function getTenantRow(tenantId: string): Promise<TTenant> {
  const db = getDb();

  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.id, tenantId));

  if (!tenant) {
    throw new Error(`deprovision-tenant: no "tenants" row for id "${tenantId}".`);
  }

  return tenant;
}
