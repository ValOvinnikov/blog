import { ERROR_CODE, type TErrorCode } from '@shinefold/config/constants';
import { getDb } from '@shinefold/db/client';
import {
  customDomainClaims,
  type TCustomDomainClaim,
} from '@shinefold/db/schema/custom-domain-claims';
import { isValidDomain } from '@shinefold/db/utils/is-valid-domain/is-valid-domain';
import { errorResult, okResult, type TResult } from '@shinefold/utils';

export async function insertCustomDomainClaim(
  tenantId: string,
  domain: string,
  token: string,
): Promise<TResult<TCustomDomainClaim, TErrorCode>> {
  if (!isValidDomain(domain)) {
    return errorResult(ERROR_CODE.DB_INVALID_DOMAIN);
  }

  const [inserted] = await getDb()
    .insert(customDomainClaims)
    .values({ tenantId, domain, token })
    .onConflictDoNothing()
    .returning();

  return inserted
    ? okResult(inserted)
    : errorResult(ERROR_CODE.DB_DOMAIN_CLAIM_EXISTS);
}
