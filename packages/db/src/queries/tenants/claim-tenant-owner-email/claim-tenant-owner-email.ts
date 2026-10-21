import type { TMaybeNull } from '@blog/config/types';
import { getDb } from '@blog/db/client';
import type { TTenantOwnerEmail } from '@blog/db/constants';
import { tenantOwnerEmailSentAtField } from '@blog/db/queries/tenants/tenant-owner-access';
import { tenants } from '@blog/db/schema/tenants';
import { and, eq, isNull } from 'drizzle-orm';

export async function claimTenantOwnerEmail(
  tenantId: string,
  email: TTenantOwnerEmail,
): Promise<TMaybeNull<Date>> {
  const field = tenantOwnerEmailSentAtField[email];
  const sentAt = tenants[field];

  const [claimed] = await getDb()
    .update(tenants)
    .set({ [field]: new Date() })
    .where(and(eq(tenants.id, tenantId), isNull(sentAt)))
    .returning({ sentAt });

  return claimed?.sentAt ?? null;
}
