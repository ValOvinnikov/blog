import type { TMaybeNull } from '@shinefold/config';
import { getDb } from '@shinefold/db/client';
import { ENTITLEMENT_KIND } from '@shinefold/db/constants';
import { tenantEntitlementGrants } from '@shinefold/db/schema/tenant-entitlement-grants';
import {
  castTo,
  columnDefault,
} from '@shinefold/db/utils/insert-select-columns/insert-select-columns';
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

// The insert reads the update's CTE, so the close runs before the open-grant unique check.
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
            id: columnDefault(tenantEntitlementGrants.id),
            tenantId: castTo(
              tenantEntitlementGrants.tenantId,
              sql`${tenantId}`,
            ),
            kind: castTo(
              tenantEntitlementGrants.kind,
              sql`${ENTITLEMENT_KIND.LOCALE_LIMIT}`,
            ),
            key: castTo(
              tenantEntitlementGrants.key,
              sql`${ENTITLEMENT_KIND.LOCALE_LIMIT}`,
            ),
            value: castTo(tenantEntitlementGrants.value, sql`${value}`),
            note: castTo(tenantEntitlementGrants.note, sql`${note}`),
            grantedBy: castTo(
              tenantEntitlementGrants.grantedBy,
              sql`${grantedBy}`,
            ),
            grantedAt: columnDefault(tenantEntitlementGrants.grantedAt),
            expiresAt: castTo(
              tenantEntitlementGrants.expiresAt,
              sql`${sql.param(expiresAt, tenantEntitlementGrants.expiresAt)}`,
            ),
            revokedAt: castTo(tenantEntitlementGrants.revokedAt, sql`null`),
            revokedBy: castTo(tenantEntitlementGrants.revokedBy, sql`null`),
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
