import { getDb } from '@blog/db/client';
import { tenants, type TTenant } from '@blog/db/schema/tenants';
import { eq } from 'drizzle-orm';

export async function getTenantBySlug(
  slug: string,
): Promise<TTenant | undefined> {
  const db = getDb();

  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.slug, slug));

  return tenant;
}
