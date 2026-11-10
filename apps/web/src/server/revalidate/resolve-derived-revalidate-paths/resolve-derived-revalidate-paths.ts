import type { TMaybeUndefined } from '@blog/config';
import type { TTenantSanityContext } from '@blog/service';
import { errorResult, type TResult } from '@blog/utils';
import {
  FETCH_FAILED_REASON,
  TENANT_UNRESOLVED_REASON,
  UNSUPPORTED_TYPE_REASON,
} from '@web/constants/revalidate';
import {
  deriveRevalidatePaths,
  isDerivableRevalidateType,
} from '@web/server/revalidate/derive-revalidate-paths/derive-revalidate-paths';

export type TResolveDerivedRevalidatePathsInput = {
  type: string;
  id: string;
  tenantId: TMaybeUndefined<string>;
  tenant: TMaybeUndefined<TTenantSanityContext>;
};

export const resolveDerivedRevalidatePaths = async ({
  type,
  id,
  tenantId,
  tenant,
}: TResolveDerivedRevalidatePathsInput): Promise<TResult<string[], string>> => {
  if (!tenantId) {
    return errorResult(TENANT_UNRESOLVED_REASON);
  }
  if (!isDerivableRevalidateType(type)) {
    return errorResult(UNSUPPORTED_TYPE_REASON);
  }
  if (!tenant) {
    return errorResult(FETCH_FAILED_REASON);
  }

  return deriveRevalidatePaths({ type, id, tenantId, tenant });
};
