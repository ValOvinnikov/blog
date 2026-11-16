import type { TMaybeNull } from '@shinefold/config/types';
import { getDb } from '@shinefold/db/client';
import type { TTenantOwnerEmail } from '@shinefold/db/constants';
import { tenantOwnerEmailSentAtField } from '@shinefold/db/queries/tenants/tenant-owner-access';
import { tenants } from '@shinefold/db/schema/tenants';
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
