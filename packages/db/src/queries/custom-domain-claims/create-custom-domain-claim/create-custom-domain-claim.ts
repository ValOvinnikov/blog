import { randomBytes } from 'node:crypto';

import { ERROR_CODE, type TErrorCode } from '@blog/config/constants';
import { getDb } from '@blog/db/client';
import {
  customDomainClaims,
  type TCustomDomainClaim,
} from '@blog/db/schema/custom-domain-claims';
import { isValidDomain } from '@blog/db/utils/is-valid-domain/is-valid-domain';
import { errorResult, okResult, type TResult } from '@blog/utils';

const CLAIM_TOKEN_BYTES = 32;

export async function createCustomDomainClaim(
  tenantId: string,
  domain: string,
): Promise<TResult<TCustomDomainClaim, TErrorCode>> {
  if (!isValidDomain(domain)) {
    return errorResult(ERROR_CODE.DB_INVALID_DOMAIN);
  }

  const [inserted] = await getDb()
    .insert(customDomainClaims)
    .values({
      tenantId,
      domain,
      token: randomBytes(CLAIM_TOKEN_BYTES).toString('hex'),
    })
    .onConflictDoNothing()
    .returning();

  return inserted
    ? okResult(inserted)
    : errorResult(ERROR_CODE.DB_DOMAIN_CLAIM_EXISTS);
}
