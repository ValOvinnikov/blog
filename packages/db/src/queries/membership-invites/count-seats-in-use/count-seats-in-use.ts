import { getDb } from '@shinefold/db/client';
import { tenants } from '@shinefold/db/schema/tenants';
import {
  seatsInUse,
  unlockedSeatsInUse,
} from '@shinefold/db/utils/seat-limit/seat-limit';
import { eq, type SQL } from 'drizzle-orm';

async function selectSeatCount(
  tenantId: string,
  seats: SQL<number>,
): Promise<number> {
  const [row] = await getDb()
    .select({ seats })
    .from(tenants)
    .where(eq(tenants.id, tenantId));

  return row?.seats ?? 0;
}

export function countSeatsInUse(tenantId: string): Promise<number> {
  return selectSeatCount(tenantId, seatsInUse(tenantId));
}

export function countUnlockedSeatsInUse(tenantId: string): Promise<number> {
  return selectSeatCount(tenantId, unlockedSeatsInUse(tenantId));
}
