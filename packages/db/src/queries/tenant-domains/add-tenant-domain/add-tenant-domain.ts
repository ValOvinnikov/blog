import { ERROR_CODE, type TErrorCode } from '@blog/config/constants';
import { getDb } from '@blog/db/client';
import {
  tenantDomains,
  type TTenantDomain,
} from '@blog/db/schema/tenant-domains';
import { isValidDomain } from '@blog/db/utils/is-valid-domain/is-valid-domain';
import type { TResult } from '@blog/utils';
import { eq } from 'drizzle-orm';

// Idempotent for the exact same (tenantId, domain) pair, since `domain` is
// globally unique and a racy double-insert would otherwise throw. A domain
// already claimed by a *different* tenant is a typed `DB_DUPLICATE_DOMAIN`
// failure rather than silently returning someone else's row. The no-op
// insert's follow-up read finding nothing (`DB_NOT_FOUND`) is a real,
// if narrow, outcome: `updateTenantDetails` can rewrite an existing row's
// `domain` value between this call's failed insert and its re-read.
export async function addTenantDomain(
  tenantId: string,
  domain: string,
): Promise<TResult<TTenantDomain, TErrorCode>> {
  if (!isValidDomain(domain)) {
    return { ok: false, error: ERROR_CODE.DB_INVALID_DOMAIN };
  }

  const db = getDb();

  const [inserted] = await db
    .insert(tenantDomains)
    .values({ tenantId, domain })
    .onConflictDoNothing()
    .returning();

  if (inserted) return { ok: true, data: inserted };

  const [existing] = await db
    .select()
    .from(tenantDomains)
    .where(eq(tenantDomains.domain, domain));

  if (!existing) {
    return { ok: false, error: ERROR_CODE.DB_NOT_FOUND };
  }

  if (existing.tenantId !== tenantId) {
    return { ok: false, error: ERROR_CODE.DB_DUPLICATE_DOMAIN };
  }

  return { ok: true, data: existing };
}
