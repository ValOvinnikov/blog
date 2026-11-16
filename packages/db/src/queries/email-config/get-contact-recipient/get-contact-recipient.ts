import type { TMaybeUndefined } from '@shinefold/config';
import { getEmailConfig } from '@shinefold/db/queries/email-config/get-email-config';
import { getTenantOwnerEmail } from '@shinefold/db/queries/memberships/get-tenant-owner-email';

export async function getContactRecipient(
  tenantId: string,
): Promise<TMaybeUndefined<string>> {
  const config = await getEmailConfig(tenantId);

  return config?.contactRecipient ?? getTenantOwnerEmail(tenantId);
}
