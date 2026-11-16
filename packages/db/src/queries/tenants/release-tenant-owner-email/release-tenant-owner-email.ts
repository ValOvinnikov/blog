import { getDb } from '@shinefold/db/client';
import type { TTenantOwnerEmail } from '@shinefold/db/constants';
import { tenantOwnerEmailSentAtField } from '@shinefold/db/queries/tenants/tenant-owner-access';
import { tenants } from '@shinefold/db/schema/tenants';
import { and, eq } from 'drizzle-orm';

export async function releaseTenantOwnerEmail(
  tenantId: string,
  email: TTenantOwnerEmail,
  claimedAt: Date,
): Promise<void> {
  const field = tenantOwnerEmailSentAtField[email];

  await getDb()
    .update(tenants)
    .set({ [field]: null })
    .where(and(eq(tenants.id, tenantId), eq(tenants[field], claimedAt)));
}
