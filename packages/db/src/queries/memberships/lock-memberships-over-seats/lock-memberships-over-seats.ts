import { getDb } from '@blog/db/client';
import { unlockedMembershipsOverSeats } from '@blog/db/queries/memberships/memberships-over-seats';
import { memberships } from '@blog/db/schema/memberships';
import { inArray } from 'drizzle-orm';

export async function lockMembershipsOverSeats(
  tenantId: string,
  seats: number,
  now: Date,
): Promise<number> {
  const locked = await getDb()
    .update(memberships)
    .set({ lockedAt: now })
    .where(
      inArray(memberships.id, unlockedMembershipsOverSeats(tenantId, seats)),
    )
    .returning({ id: memberships.id });

  return locked.length;
}
