import type { TErrorCode } from '@blog/config/constants';
import type { TCustomDomainClaim } from '@blog/db/schema/custom-domain-claims';
import type { TResult } from '@blog/utils';

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
