import { getDb } from '@blog/db/client';
import { MEMBERSHIP_ROLE } from '@blog/db/constants';
import { memberships } from '@blog/db/schema/memberships';
import { and, eq, gt, isNull, sql } from 'drizzle-orm';

// The owner always keeps a seat; the rest are seated by when they joined.
export function unlockedMembershipsOverSeats(tenantId: string, seats: number) {
  const db = getDb();
  const ranked = db
    .select({
      id: memberships.id,
      lockedAt: memberships.lockedAt,
      seat: sql<number>`row_number() over (order by ${memberships.role} = ${MEMBERSHIP_ROLE.OWNER} desc, ${memberships.createdAt}, ${memberships.id})`.as(
        'seat',
      ),
    })
    .from(memberships)
    .where(eq(memberships.tenantId, tenantId))
    .as('ranked');

  return db
    .select({ id: ranked.id })
    .from(ranked)
    .where(and(gt(ranked.seat, seats), isNull(ranked.lockedAt)));
}
