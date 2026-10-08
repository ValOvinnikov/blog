import { queries } from '@blog/db';
import type { TTenant } from '@blog/db/schema/tenants';

export type TPendingInviteTenant = Pick<TTenant, 'name' | 'locale'>;

export async function findPendingInviteTenants(
  email: string,
): Promise<TPendingInviteTenant[]> {
  const invites =
    await queries.membershipInvites.findPendingInviteByEmail(email);
  if (invites.length === 0) return [];

  const tenants = await queries.tenants.listTenantsByIds(
    invites.map((invite) => invite.tenantId),
  );

  return tenants.map(({ name, locale }) => ({ name, locale }));
}
