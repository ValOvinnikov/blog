import { randomBytes } from 'node:crypto';

import type { TErrorCode } from '@blog/config/constants';
import type { TCustomDomainClaim } from '@blog/db/schema/custom-domain-claims';
import type { TResult } from '@blog/utils';

import { insertCustomDomainClaim } from '../insert-custom-domain-claim';

const CLAIM_TOKEN_BYTES = 32;

export function createCustomDomainClaim(
  tenantId: string,
  domain: string,
): Promise<TResult<TCustomDomainClaim, TErrorCode>> {
  return insertCustomDomainClaim(
    tenantId,
    domain,
    randomBytes(CLAIM_TOKEN_BYTES).toString('hex'),
  );
}
