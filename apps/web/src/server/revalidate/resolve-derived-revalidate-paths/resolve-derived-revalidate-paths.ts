import type { TMaybeNull, TMaybeUndefined } from '@blog/config';
import type { TTenantSanityContext } from '@blog/service';
import { errorResult, type TResult } from '@blog/utils';
import {
  FETCH_FAILED_REASON,
  TENANT_UNRESOLVED_REASON,
} from '@web/constants/revalidate';
import { deriveRevalidatePaths } from '@web/server/revalidate/derive-revalidate-paths/derive-revalidate-paths';

export type TResolveDerivedRevalidatePathsInput = {
  type: string;
  id: string;
  slug: TMaybeUndefined<string>;
  operation: TMaybeNull<string>;
  tenantId: TMaybeUndefined<string>;
  tenant: TMaybeUndefined<TTenantSanityContext>;
};

export const resolveDerivedRevalidatePaths = async ({
  type,
  id,
  slug,
  operation,
  tenantId,
  tenant,
}: TResolveDerivedRevalidatePathsInput): Promise<TResult<string[], string>> => {
  if (!tenantId) {
    return errorResult(TENANT_UNRESOLVED_REASON);
  }
  if (!tenant) {
    return errorResult(FETCH_FAILED_REASON);
  }

  return deriveRevalidatePaths({
    type,
    id,
    slug,
    operation,
    tenantId,
    tenant,
  });
};
