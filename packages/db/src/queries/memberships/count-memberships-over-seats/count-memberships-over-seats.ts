import { getDb } from '@blog/db/client';
import { unlockedMembershipsOverSeats } from '@blog/db/queries/memberships/memberships-over-seats';

export async function countMembershipsOverSeats(
  tenantId: string,
  seats: number,
): Promise<number> {
  return getDb().$count(
    unlockedMembershipsOverSeats(tenantId, seats).as('over'),
  );
}
