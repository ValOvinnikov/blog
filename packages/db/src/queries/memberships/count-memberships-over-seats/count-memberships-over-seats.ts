import { getDb } from '@shinefold/db/client';
import { unlockedMembershipsOverSeats } from '@shinefold/db/queries/memberships/memberships-over-seats';

export async function countMembershipsOverSeats(
  tenantId: string,
  seats: number,
): Promise<number> {
  return getDb().$count(
    unlockedMembershipsOverSeats(tenantId, seats).as('over'),
  );
}
