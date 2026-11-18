import type { TMaybeUndefined } from '@shinefold/config';
import type { TTenantSanityContext } from '@shinefold/service';
import { errorResult, type TResult } from '@shinefold/utils';
import {
  FETCH_FAILED_REASON,
  TENANT_UNRESOLVED_REASON,
} from '@web/constants/revalidate';
import {
  deriveRevalidatePaths,
  type TDeriveRevalidatePathsInput,
} from '@web/server/revalidate/derive-revalidate-paths/derive-revalidate-paths';

export type TResolveDerivedRevalidatePathsInput = Omit<
  TDeriveRevalidatePathsInput,
  'tenantId' | 'tenant'
> & {
  tenantId: TMaybeUndefined<string>;
  tenant: TMaybeUndefined<TTenantSanityContext>;
};

export const resolveDerivedRevalidatePaths = async ({
  tenantId,
  tenant,
  ...document
}: TResolveDerivedRevalidatePathsInput): Promise<TResult<string[], string>> => {
  if (!tenantId) {
    return errorResult(TENANT_UNRESOLVED_REASON);
  }
  if (!tenant) {
    return errorResult(FETCH_FAILED_REASON);
  }

  return deriveRevalidatePaths({ ...document, tenantId, tenant });
};
