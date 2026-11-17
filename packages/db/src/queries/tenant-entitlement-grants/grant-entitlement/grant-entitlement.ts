import type { TMaybeNull } from '@shinefold/config';
import { ERROR_CODE, type TErrorCode } from '@shinefold/config/constants';
import { getDb } from '@shinefold/db/client';
import {
  ENTITLEMENT_KIND,
  type TEntitlementGrantItem,
} from '@shinefold/db/constants';
import {
  TENANT_ENTITLEMENT_GRANTS_OPEN_UNIQUE_NAME,
  tenantEntitlementGrants,
  type TTenantEntitlementGrant,
} from '@shinefold/db/schema/tenant-entitlement-grants';
import { uniqueViolationConstraint } from '@shinefold/db/utils/constraint-violation/constraint-violation';
import { errorResult, okResult, type TResult } from '@shinefold/utils';
import { and, eq, isNull, lte, sql } from 'drizzle-orm';

export type TGrantEntitlementInput = {
  tenantId: string;
  item: TEntitlementGrantItem;
  grantedBy: string;
  expiresAt: TMaybeNull<Date>;
  note: TMaybeNull<string>;
};

function toStoredItem(item: TEntitlementGrantItem) {
  return item.kind === ENTITLEMENT_KIND.LOCALE_LIMIT
    ? { kind: item.kind, key: item.kind, value: item.value }
    : { kind: item.kind, key: item.key, value: null };
}

export async function grantEntitlement({
  tenantId,
  item,
  grantedBy,
  expiresAt,
  note,
}: TGrantEntitlementInput): Promise<
  TResult<TTenantEntitlementGrant, TErrorCode>
> {
  const db = getDb();
  const stored = toStoredItem(item);

  await db
    .update(tenantEntitlementGrants)
    .set({ revokedAt: sql`${tenantEntitlementGrants.expiresAt}` })
    .where(
      and(
        eq(tenantEntitlementGrants.tenantId, tenantId),
        eq(tenantEntitlementGrants.kind, stored.kind),
        eq(tenantEntitlementGrants.key, stored.key),
        isNull(tenantEntitlementGrants.revokedAt),
        lte(tenantEntitlementGrants.expiresAt, new Date()),
      ),
    );

  try {
    const [grant] = await db
      .insert(tenantEntitlementGrants)
      .values({ tenantId, ...stored, grantedBy, expiresAt, note })
      .returning();

    if (!grant) {
      throw new Error('grantEntitlement: insert returned no row.');
    }

    return okResult(grant);
  } catch (error) {
    if (
      uniqueViolationConstraint(error) ===
      TENANT_ENTITLEMENT_GRANTS_OPEN_UNIQUE_NAME
    ) {
      return errorResult(ERROR_CODE.DB_ENTITLEMENT_ALREADY_GRANTED);
    }
    throw error;
  }
}
