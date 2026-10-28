import { ERROR_CODE, type TErrorCode } from '@blog/config/constants';
import { getDb } from '@blog/db/client';
import { customDomainClaims } from '@blog/db/schema/custom-domain-claims';
import {
  tenantDomains,
  TENANT_DOMAINS_DOMAIN_UNIQUE_NAME,
  type TTenantDomain,
} from '@blog/db/schema/tenant-domains';
import { uniqueViolationConstraint } from '@blog/db/utils/unique-violation/unique-violation';
import { errorResult, okResult, type TResult } from '@blog/utils';
import { and, eq, sql } from 'drizzle-orm';

// One statement, because `neon-http` has no transactions: the claim's delete
// and the `tenant_domains` insert succeed or fail together, so a domain held
// by another site leaves the claim in place.
export async function promoteCustomDomainClaim(
  tenantId: string,
  claimId: string,
): Promise<TResult<TTenantDomain, TErrorCode>> {
  const db = getDb();

  const deletedClaim = db.$with('deleted_claim').as(
    db
      .delete(customDomainClaims)
      .where(
        and(
          eq(customDomainClaims.id, claimId),
          eq(customDomainClaims.tenantId, tenantId),
        ),
      )
      .returning({
        tenantId: customDomainClaims.tenantId,
        domain: customDomainClaims.domain,
      }),
  );

  try {
    const [promoted] = await db
      .with(deletedClaim)
      .insert(tenantDomains)
      .select(
        db
          .select({
            id: sql<string>`gen_random_uuid()`.as('id'),
            tenantId: sql<string>`${deletedClaim.tenantId}`.as('tenant_id'),
            domain: sql<string>`${deletedClaim.domain}`.as('domain'),
            createdAt: sql<Date>`now()`.as('created_at'),
          })
          .from(deletedClaim),
      )
      .returning();

    return promoted ? okResult(promoted) : errorResult(ERROR_CODE.DB_NOT_FOUND);
  } catch (error) {
    if (
      uniqueViolationConstraint(error) === TENANT_DOMAINS_DOMAIN_UNIQUE_NAME
    ) {
      return errorResult(ERROR_CODE.DB_DUPLICATE_DOMAIN);
    }
    throw error;
  }
}
