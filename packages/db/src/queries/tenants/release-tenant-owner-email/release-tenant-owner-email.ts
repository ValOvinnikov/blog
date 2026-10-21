import { getDb } from '@blog/db/client';
import type { TTenantOwnerEmail } from '@blog/db/constants';
import { tenantOwnerEmailSentAtField } from '@blog/db/queries/tenants/tenant-owner-access';
import { tenants } from '@blog/db/schema/tenants';
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
