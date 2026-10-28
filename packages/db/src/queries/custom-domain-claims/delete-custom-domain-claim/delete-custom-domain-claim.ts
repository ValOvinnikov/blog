import { getDb } from '@blog/db/client';
import { customDomainClaims } from '@blog/db/schema/custom-domain-claims';
import { eq } from 'drizzle-orm';

export async function deleteCustomDomainClaim(
  tenantId: string,
): Promise<boolean> {
  const deleted = await getDb()
    .delete(customDomainClaims)
    .where(eq(customDomainClaims.tenantId, tenantId))
    .returning({ id: customDomainClaims.id });

  return deleted.length > 0;
}
