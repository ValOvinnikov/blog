import type { TMaybeUndefined } from '@blog/config/types';
import { getDb } from '@blog/db/client';
import {
  customDomainClaims,
  type TCustomDomainClaim,
} from '@blog/db/schema/custom-domain-claims';
import { eq } from 'drizzle-orm';

export async function getCustomDomainClaim(
  tenantId: string,
): Promise<TMaybeUndefined<TCustomDomainClaim>> {
  const [claim] = await getDb()
    .select()
    .from(customDomainClaims)
    .where(eq(customDomainClaims.tenantId, tenantId));

  return claim;
}
