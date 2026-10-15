import type { TMaybeUndefined } from '@blog/config';
import { getEmailConfig } from '@blog/db/queries/email-config/get-email-config';
import { getTenantOwnerEmail } from '@blog/db/queries/memberships/get-tenant-owner-email';

export async function getContactRecipient(
  tenantId: string,
): Promise<TMaybeUndefined<string>> {
  const config = await getEmailConfig(tenantId);

  return config?.contactRecipient ?? getTenantOwnerEmail(tenantId);
}
