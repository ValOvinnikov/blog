import { ERROR_CODE, type TErrorCode } from '@blog/config/constants';
import { getDb } from '@blog/db/client';
import { type TTenantPlan, type TTenantStatus } from '@blog/db/constants';
import { tenants, type TTenant } from '@blog/db/schema/tenants';
import { isValidDomain } from '@blog/db/utils/is-valid-domain/is-valid-domain';
import type { TResult } from '@blog/utils';
import { eq } from 'drizzle-orm';

export type TCreateTenantInput = {
  slug: string;
  name: string;
  primaryDomain: string;
  sanityProjectId: string;
  sanityDataset: string;
  locale: string;
  plan: TTenantPlan;
  status: TTenantStatus;
};

// Atomic `onConflictDoNothing()` plus a follow-up read, the same pattern
// `addTenantDomain` uses for `tenant_domains.domain` — a plain insert would
// let a duplicate `slug` escape as a raw, unmapped Postgres constraint
// error instead of a typed outcome the caller can map to a field error.
export async function createTenant(
  input: TCreateTenantInput,
): Promise<TResult<TTenant, TErrorCode>> {
  if (!isValidDomain(input.primaryDomain)) {
    return { ok: false, error: ERROR_CODE.DB_INVALID_DOMAIN };
  }

  const db = getDb();

  const [inserted] = await db
    .insert(tenants)
    .values(input)
    .onConflictDoNothing({ target: tenants.slug })
    .returning();

  if (inserted) return { ok: true, data: inserted };

  const [existing] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.slug, input.slug));

  if (!existing) {
    // A real, if narrow, race: the insert no-ops on a `slug` conflict, but `updateTenantDetails` can rename the slug away before this read.
    return { ok: false, error: ERROR_CODE.DB_NOT_FOUND };
  }

  return { ok: false, error: ERROR_CODE.DB_DUPLICATE_SLUG };
}
