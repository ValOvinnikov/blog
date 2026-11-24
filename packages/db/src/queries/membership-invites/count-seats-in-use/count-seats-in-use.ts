import { getDb } from '@shinefold/db/client';
import { tenants } from '@shinefold/db/schema/tenants';
import { seatsInUse } from '@shinefold/db/utils/seat-limit/seat-limit';
import { eq } from 'drizzle-orm';

export async function countSeatsInUse(tenantId: string): Promise<number> {
  const [row] = await getDb()
    .select({ seats: seatsInUse(tenantId) })
    .from(tenants)
    .where(eq(tenants.id, tenantId));

  return row?.seats ?? 0;
}
