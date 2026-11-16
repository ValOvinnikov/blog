import type { TMaybeUndefined } from '@shinefold/config/types';
import { getDb } from '@shinefold/db/client';
import {
  customDomainClaims,
  type TCustomDomainClaim,
} from '@shinefold/db/schema/custom-domain-claims';
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
