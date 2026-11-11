import { ERROR_CODE, type TErrorCode } from '@blog/config/constants';
import type { TMaybeNull } from '@blog/config/types';
import { getDb } from '@blog/db/client';
import { getTenantBilling } from '@blog/db/queries/tenants/get-tenant-billing';
import {
  tenantBillingColumns,
  toTenantBilling,
  type TTenantBilling,
} from '@blog/db/queries/tenants/tenant-billing';
import { tenants } from '@blog/db/schema/tenants';
import { errorResult, okResult, type TResult } from '@blog/utils';
import { isUndefined } from '@blog/utils/primitives';
import { eq } from 'drizzle-orm';

// A field left out keeps its stored value; `null` clears it.
export type TSetTenantBillingInput = {
  [K in keyof TTenantBilling]?: TMaybeNull<
    Exclude<TTenantBilling[K], undefined>
  >;
};

export async function setTenantBilling(
  tenantId: string,
  input: TSetTenantBillingInput,
): Promise<TResult<TTenantBilling, TErrorCode>> {
  if (Object.values(input).every(isUndefined)) {
    const billing = await getTenantBilling(tenantId);

    return billing ? okResult(billing) : errorResult(ERROR_CODE.DB_NOT_FOUND);
  }

  const [row] = await getDb()
    .update(tenants)
    .set(input)
    .where(eq(tenants.id, tenantId))
    .returning(tenantBillingColumns);

  return row
    ? okResult(toTenantBilling(row))
    : errorResult(ERROR_CODE.DB_NOT_FOUND);
}
