import { getDb } from '@blog/db/client';
import { memberships, type TMembership } from '@blog/db/schema/memberships';
import { tenants, type TTenant } from '@blog/db/schema/tenants';
import { eq } from 'drizzle-orm';

export type TMembershipWithTenant = {
  membership: TMembership;
  tenant: TTenant;
};

export async function listMembershipsWithTenantsForUser(
  userId: string,
): Promise<TMembershipWithTenant[]> {
  const db = getDb();

  return db
    .select({ membership: memberships, tenant: tenants })
    .from(memberships)
    .innerJoin(tenants, eq(memberships.tenantId, tenants.id))
    .where(eq(memberships.userId, userId));
}
