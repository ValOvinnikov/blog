import type { TMaybeNull } from '@shinefold/config';
import { ERROR_CODE } from '@shinefold/config/constants';
import { getDb } from '@shinefold/db/client';
import { ENTITLEMENT_KIND } from '@shinefold/db/constants';
import { isOpenGrantOf } from '@shinefold/db/queries/tenant-entitlement-grants/open-grant-condition';
import { tenantEntitlementGrants } from '@shinefold/db/schema/tenant-entitlement-grants';
import { isNull as isNullValue } from '@shinefold/utils/primitives';
import { and, eq, isNotNull, isNull, lt, lte, sql } from 'drizzle-orm';

import type { TGrantEntitlementInput } from './grant-entitlement';

type TRaiseLocaleLimitInput = Omit<TGrantEntitlementInput, 'item'> & {
  value: number;
};

function endsNoLaterThan(expiresAt: TMaybeNull<Date>) {
  return isNullValue(expiresAt)
    ? undefined
    : and(
        isNotNull(tenantEntitlementGrants.expiresAt),
        lte(tenantEntitlementGrants.expiresAt, expiresAt),
      );
}

// One statement, because `neon-http` has no transactions: the open grant closes
// and the raise opens together, so the site never drops to its plan's limit.
export async function raiseLocaleLimitGrant({
  tenantId,
  value,
  grantedBy,
  expiresAt,
  note,
}: TRaiseLocaleLimitInput) {
  const db = getDb();
  const closed = db.$with('closed').as(
    db
      .update(tenantEntitlementGrants)
      .set({ revokedAt: sql`now()`, revokedBy: grantedBy })
      .where(
        and(
          eq(tenantEntitlementGrants.tenantId, tenantId),
          eq(tenantEntitlementGrants.kind, ENTITLEMENT_KIND.LOCALE_LIMIT),
          isNull(tenantEntitlementGrants.revokedAt),
          lt(tenantEntitlementGrants.value, value),
          endsNoLaterThan(expiresAt),
        ),
      )
      .returning({ id: tenantEntitlementGrants.id }),
  );
  const closedGrant = db.$with('closed_grant').as(
    db
      .select({
        closedGrantId: sql<TMaybeNull<string>>`(array_agg(${closed.id}))[1]`.as(
          'closed_grant_id',
        ),
      })
      .from(closed),
  );
  const opened = db.$with('opened').as(
    db
      .insert(tenantEntitlementGrants)
      .select(
        db
          .select({
            id: sql<string>`gen_random_uuid()`.as('id'),
            tenantId: sql<string>`${tenantId}::uuid`.as('tenant_id'),
            kind: sql<string>`${ENTITLEMENT_KIND.LOCALE_LIMIT}`.as('kind'),
            key: sql<string>`${ENTITLEMENT_KIND.LOCALE_LIMIT}`.as('key'),
            value: sql<number>`${value}::integer`.as('value'),
            note: sql<TMaybeNull<string>>`${note}::text`.as('note'),
            grantedBy: sql<string>`${grantedBy}::uuid`.as('granted_by'),
            grantedAt: sql<Date>`now()`.as('granted_at'),
            expiresAt: sql<TMaybeNull<Date>>`${sql.param(
              expiresAt,
              tenantEntitlementGrants.expiresAt,
            )}::timestamp`.as('expires_at'),
            revokedAt: sql<null>`null::timestamp`.as('revoked_at'),
            revokedBy: sql<null>`null::uuid`.as('revoked_by'),
          })
          .from(closedGrant),
      )
      .returning(),
  );

  const [raised] = await db
    .with(closed, closedGrant, opened)
    .select()
    .from(opened)
    .crossJoin(closedGrant);

  return (
    raised && {
      grant: raised.opened,
      closedGrantId: raised.closed_grant.closedGrantId,
    }
  );
}

export async function localeLimitRaiseRefusal(tenantId: string, value: number) {
  const [open] = await getDb()
    .select({ value: tenantEntitlementGrants.value })
    .from(tenantEntitlementGrants)
    .where(
      and(
        isOpenGrantOf(tenantId),
        eq(tenantEntitlementGrants.kind, ENTITLEMENT_KIND.LOCALE_LIMIT),
      ),
    );

  const openValue = open?.value ?? null;

  return !isNullValue(openValue) && openValue < value
    ? ERROR_CODE.DB_ENTITLEMENT_EXPIRY_SHORTENED
    : ERROR_CODE.DB_ENTITLEMENT_ALREADY_GRANTED;
}
