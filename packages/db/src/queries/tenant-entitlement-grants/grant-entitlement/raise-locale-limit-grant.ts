import type { TMaybeNull } from '@shinefold/config';
import { getDb } from '@shinefold/db/client';
import { ENTITLEMENT_KIND } from '@shinefold/db/constants';
import { tenantEntitlementGrants } from '@shinefold/db/schema/tenant-entitlement-grants';
import { and, eq, isNull, lt, sql } from 'drizzle-orm';

import type { TGrantEntitlementInput } from './grant-entitlement';

// One statement, because `neon-http` has no transactions: the open lower
// language grant closes and the higher one opens together, so the site never
// drops to its plan's limit in between. Reading `closed` forces the update to
// run before the insert checks the open-grant index.
export async function raiseLocaleLimitGrant({
  tenantId,
  value,
  grantedBy,
  expiresAt,
  note,
}: Omit<TGrantEntitlementInput, 'item'> & { value: number }) {
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
        ),
      )
      .returning({ id: tenantEntitlementGrants.id }),
  );
  const closedCount = db
    .$with('closed_count')
    .as(db.select({ count: sql<number>`count(*)`.as('count') }).from(closed));

  return db
    .with(closed, closedCount)
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
          expiresAt: sql<TMaybeNull<Date>>`${expiresAt}::timestamp`.as(
            'expires_at',
          ),
          revokedAt: sql<null>`null::timestamp`.as('revoked_at'),
          revokedBy: sql<null>`null::uuid`.as('revoked_by'),
        })
        .from(closedCount),
    )
    .returning();
}
