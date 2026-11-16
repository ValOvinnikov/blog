import {
  ERROR_CODE,
  type TErrorCode,
  type TTenantPlan,
} from '@shinefold/config/constants';
import { getDb } from '@shinefold/db/client';
import { type TTenantStatus } from '@shinefold/db/constants';
import { tenants, type TTenant } from '@shinefold/db/schema/tenants';
import { isValidDomain } from '@shinefold/db/utils/is-valid-domain/is-valid-domain';
import { normalizeLocaleCode } from '@shinefold/db/utils/normalize-locale-code/normalize-locale-code';
import { errorResult, okResult, type TResult } from '@shinefold/utils';

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
    return errorResult(ERROR_CODE.DB_INVALID_DOMAIN);
  }

  const db = getDb();

  const [inserted] = await db
    .insert(tenants)
    .values({ ...input, locale: normalizeLocaleCode(input.locale) })
    .returning();

  if (!inserted) {
    throw new Error('createTenant: insert returned no row.');
  }

  return okResult(inserted);
}
