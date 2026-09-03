import { ERROR_CODE, type TErrorCode } from '@blog/config/constants';
import { getDb } from '@blog/db/client';
import { type TTenantPlan, type TTenantStatus } from '@blog/db/constants';
import { tenants, type TTenant } from '@blog/db/schema/tenants';
import { isValidDomain } from '@blog/db/utils/is-valid-domain/is-valid-domain';
import type { TResult } from '@blog/utils';

export type TCreateTenantInput = {
  name: string;
  primaryDomain: string;
  sanityProjectId: string;
  sanityDataset: string;
  locale: string;
  plan: TTenantPlan;
  status: TTenantStatus;
};

export async function createTenant(
  input: TCreateTenantInput,
): Promise<TResult<TTenant, TErrorCode>> {
  if (!isValidDomain(input.primaryDomain)) {
    return { ok: false, error: ERROR_CODE.DB_INVALID_DOMAIN };
  }

  const db = getDb();

  const [inserted] = await db.insert(tenants).values(input).returning();

  if (!inserted) {
    throw new Error('createTenant: insert returned no row.');
  }

  return { ok: true, data: inserted };
}
