import type { TMaybeNull, TMaybeUndefined } from '@shinefold/config';
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
import { toStoredEntitlementItem } from '@shinefold/db/utils/stored-entitlement-item/stored-entitlement-item';
import { errorResult, okResult, type TResult } from '@shinefold/utils';
import { and, eq, isNull, lte, sql } from 'drizzle-orm';

import {
  localeLimitRaiseRefusal,
  raiseLocaleLimitGrant,
} from './raise-locale-limit-grant';

export type TGrantEntitlementInput = {
  tenantId: string;
  item: TEntitlementGrantItem;
  grantedBy: string;
  expiresAt: TMaybeNull<Date>;
  note: TMaybeNull<string>;
};

export type TGrantedEntitlement = {
  grant: TTenantEntitlementGrant;
  closedGrantId: TMaybeNull<string>;
};

export async function grantEntitlement({
  tenantId,
  item,
  grantedBy,
  expiresAt,
  note,
}: TGrantEntitlementInput): Promise<TResult<TGrantedEntitlement, TErrorCode>> {
  const db = getDb();
  const stored = toStoredEntitlementItem(item);

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
    const granted =
      item.kind === ENTITLEMENT_KIND.LOCALE_LIMIT
        ? await raiseLocaleLimitGrant({
            tenantId,
            value: item.value,
            grantedBy,
            expiresAt,
            note,
          })
        : await insertGrant({
            tenantId,
            ...stored,
            grantedBy,
            expiresAt,
            note,
          });

    if (!granted) {
      throw new Error('grantEntitlement: insert returned no row.');
    }

    return okResult(granted);
  } catch (error) {
    if (
      uniqueViolationConstraint(error) !==
      TENANT_ENTITLEMENT_GRANTS_OPEN_UNIQUE_NAME
    ) {
      throw error;
    }
    return errorResult(
      item.kind === ENTITLEMENT_KIND.LOCALE_LIMIT
        ? await localeLimitRaiseRefusal(tenantId, item.value)
        : ERROR_CODE.DB_ENTITLEMENT_ALREADY_GRANTED,
    );
  }
}

async function insertGrant(
  values: typeof tenantEntitlementGrants.$inferInsert,
): Promise<TMaybeUndefined<TGrantedEntitlement>> {
  const [grant] = await getDb()
    .insert(tenantEntitlementGrants)
    .values(values)
    .returning();

  return grant && { grant, closedGrantId: null };
}
