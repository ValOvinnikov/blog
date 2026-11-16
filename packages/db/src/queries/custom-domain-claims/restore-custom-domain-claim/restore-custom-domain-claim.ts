import type { TErrorCode } from '@shinefold/config/constants';
import type { TCustomDomainClaim } from '@shinefold/db/schema/custom-domain-claims';
import type { TResult } from '@shinefold/utils';

import { insertCustomDomainClaim } from '../insert-custom-domain-claim';

export interface IRestoreCustomDomainClaimInput {
  tenantId: string;
  domain: string;
  token: string;
}

export function restoreCustomDomainClaim({
  tenantId,
  domain,
  token,
}: IRestoreCustomDomainClaimInput): Promise<
  TResult<TCustomDomainClaim, TErrorCode>
> {
  return insertCustomDomainClaim(tenantId, domain, token);
}
