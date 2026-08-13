import { getDb } from '@blog/db/client';
import { tenants, type TTenant } from '@blog/db/schema/tenants';
import { asc } from 'drizzle-orm';

export async function listTenants(): Promise<TTenant[]> {
  const db = getDb();

  return db.select().from(tenants).orderBy(asc(tenants.slug));
}
